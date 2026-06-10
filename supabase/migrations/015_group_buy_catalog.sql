-- 그룹 바이 + 공급자 카탈로그 자동 누적
-- M15: 동일 시약 N명 묶음 + 거래완료시 카탈로그 자동 기록

-- =====================
-- 1. 공급자 카탈로그 (거래 누적)
-- =====================
CREATE TABLE IF NOT EXISTS supplier_catalog (
  supplier_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 식별 키 — CAS가 있으면 CAS, 없으면 정규화된 substance_name
  match_key          text NOT NULL,
  cas_number         text,
  substance_name     text NOT NULL,
  transactions_count int  NOT NULL DEFAULT 0,
  total_qty          numeric DEFAULT 0,
  total_price        numeric DEFAULT 0,
  last_price         numeric,
  last_qty           numeric,
  last_unit          text,
  last_date          timestamptz,
  avg_unit_price     numeric,   -- total_price / total_qty (수량 단위가 일관될 때만 의미)
  PRIMARY KEY (supplier_id, match_key)
);

CREATE INDEX IF NOT EXISTS supplier_catalog_match_idx ON supplier_catalog(match_key);
CREATE INDEX IF NOT EXISTS supplier_catalog_cas_idx ON supplier_catalog(cas_number) WHERE cas_number IS NOT NULL;

ALTER TABLE supplier_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_catalog_read_all" ON supplier_catalog;
CREATE POLICY "supplier_catalog_read_all" ON supplier_catalog FOR SELECT USING (true);
DROP POLICY IF EXISTS "supplier_catalog_write_service" ON supplier_catalog;
CREATE POLICY "supplier_catalog_write_service" ON supplier_catalog FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE supplier_catalog IS '공급자별 거래 이력 누적 — 거래완료 시 자동 기록되어 다음 견적 요청 시 표시';

-- 매칭 키 정규화
CREATE OR REPLACE FUNCTION normalize_match_key(p_cas text, p_name text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_cas IS NOT NULL AND p_cas !~ '^\s*$' THEN trim(p_cas)
    ELSE lower(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'))
  END;
$$;

-- 카탈로그 누적 RPC (거래완료 시 호출)
CREATE OR REPLACE FUNCTION record_transaction_to_catalog(p_transaction_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bid_id    uuid;
  v_supplier  uuid;
  v_request   uuid;
  v_inserted  int := 0;
  rec record;
BEGIN
  -- 거래에서 bid_id, supplier_id, request_id 추출
  SELECT t.bid_id, b.supplier_id, t.request_id
    INTO v_bid_id, v_supplier, v_request
    FROM transactions t
    JOIN bids b ON b.id = t.bid_id
   WHERE t.id = p_transaction_id;
  IF v_supplier IS NULL THEN RETURN 0; END IF;

  -- bid_items × request_items로 품목별 단가·수량 누적
  FOR rec IN
    SELECT bi.total_price, ri.qty, ri.unit, ri.cas_number, ri.substance_name
      FROM bid_items bi
      JOIN request_items ri ON ri.id = bi.request_item_id
     WHERE bi.bid_id = v_bid_id AND bi.available = true
  LOOP
    IF rec.total_price IS NULL OR rec.total_price <= 0 THEN CONTINUE; END IF;
    INSERT INTO supplier_catalog (
      supplier_id, match_key, cas_number, substance_name,
      transactions_count, total_qty, total_price,
      last_price, last_qty, last_unit, last_date, avg_unit_price
    ) VALUES (
      v_supplier,
      normalize_match_key(rec.cas_number, rec.substance_name),
      NULLIF(rec.cas_number, ''), rec.substance_name,
      1, COALESCE(rec.qty, 0), rec.total_price,
      rec.total_price, rec.qty, rec.unit, now(),
      CASE WHEN COALESCE(rec.qty,0) > 0 THEN rec.total_price / rec.qty ELSE NULL END
    )
    ON CONFLICT (supplier_id, match_key) DO UPDATE SET
      transactions_count = supplier_catalog.transactions_count + 1,
      total_qty          = supplier_catalog.total_qty + COALESCE(EXCLUDED.last_qty, 0),
      total_price        = supplier_catalog.total_price + EXCLUDED.last_price,
      last_price         = EXCLUDED.last_price,
      last_qty           = EXCLUDED.last_qty,
      last_unit          = EXCLUDED.last_unit,
      last_date          = EXCLUDED.last_date,
      cas_number         = COALESCE(supplier_catalog.cas_number, EXCLUDED.cas_number),
      substance_name     = EXCLUDED.substance_name,
      avg_unit_price     = CASE WHEN (supplier_catalog.total_qty + COALESCE(EXCLUDED.last_qty,0)) > 0
                                THEN (supplier_catalog.total_price + EXCLUDED.last_price) /
                                     (supplier_catalog.total_qty + COALESCE(EXCLUDED.last_qty,0))
                                ELSE NULL END;
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN v_inserted;
END;
$$;

-- 특정 시약을 공급한 이력이 있는 공급자 목록 (researcher가 견적 요청 작성 시 보조)
CREATE OR REPLACE FUNCTION suppliers_for_substance(p_cas text, p_name text, p_limit int DEFAULT 5)
RETURNS TABLE (
  supplier_id uuid,
  company_name text,
  transactions_count int,
  avg_unit_price numeric,
  last_price numeric,
  last_unit text,
  last_date timestamptz,
  tier text,
  referral_code text
) LANGUAGE sql STABLE AS $$
  SELECT
    sc.supplier_id,
    sp.company_name,
    sc.transactions_count,
    sc.avg_unit_price,
    sc.last_price,
    sc.last_unit,
    sc.last_date,
    sp.referral_tier,
    sp.referral_code
  FROM supplier_catalog sc
  JOIN supplier_profiles sp ON sp.user_id = sc.supplier_id
  WHERE sc.match_key = normalize_match_key(p_cas, p_name)
  ORDER BY sc.transactions_count DESC, sc.last_date DESC
  LIMIT p_limit;
$$;

-- =====================
-- 2. 그룹 바이 — 동일 시약 N명 묶음 (함수형, 별도 테이블 불필요)
-- =====================

-- 활성(open) 요청 중 동일 시약(CAS 또는 substance_name) 클러스터 — 최근 N일
CREATE OR REPLACE FUNCTION current_group_buys(p_days int DEFAULT 7, p_min_researchers int DEFAULT 2)
RETURNS TABLE (
  match_key text,
  cas_number text,
  substance_name text,
  researcher_count int,
  request_count int,
  total_qty numeric,
  unit text,
  request_ids uuid[]
) LANGUAGE sql STABLE AS $$
  WITH base AS (
    SELECT
      normalize_match_key(ri.cas_number, ri.substance_name) AS mkey,
      ri.cas_number,
      ri.substance_name,
      ri.qty,
      ri.unit,
      r.id   AS request_id,
      r.researcher_id
    FROM requests r
    JOIN request_items ri ON ri.request_id = r.id
    WHERE r.status = 'open'
      AND r.created_at > now() - make_interval(days => p_days)
  )
  SELECT
    mkey,
    -- 대표 CAS·이름 (가장 자주 나오는 값)
    MAX(cas_number)               AS cas_number,
    MAX(substance_name)           AS substance_name,
    COUNT(DISTINCT researcher_id)::int AS researcher_count,
    COUNT(DISTINCT request_id)::int    AS request_count,
    SUM(qty)::numeric             AS total_qty,
    MAX(unit)                     AS unit,
    array_agg(DISTINCT request_id) AS request_ids
  FROM base
  GROUP BY mkey
  HAVING COUNT(DISTINCT researcher_id) >= p_min_researchers
  ORDER BY COUNT(DISTINCT researcher_id) DESC, SUM(qty) DESC NULLS LAST
  LIMIT 30;
$$;

-- 특정 요청에 대해 함께 묶일 수 있는 동료 요청 수
CREATE OR REPLACE FUNCTION group_buy_peers_for(p_request_id uuid)
RETURNS json LANGUAGE sql STABLE AS $$
  WITH self AS (
    SELECT
      normalize_match_key(ri.cas_number, ri.substance_name) AS mkey,
      r.researcher_id
    FROM requests r
    JOIN request_items ri ON ri.request_id = r.id
    WHERE r.id = p_request_id
    LIMIT 1
  ),
  peers AS (
    SELECT DISTINCT r.researcher_id, r.id AS rid, ri.qty, ri.unit
    FROM requests r
    JOIN request_items ri ON ri.request_id = r.id
    JOIN self s ON normalize_match_key(ri.cas_number, ri.substance_name) = s.mkey
                  AND r.researcher_id <> s.researcher_id
    WHERE r.status = 'open'
      AND r.created_at > now() - INTERVAL '7 days'
  )
  SELECT json_build_object(
    'researcher_count', COUNT(DISTINCT researcher_id),
    'request_count', COUNT(DISTINCT rid),
    'total_qty', COALESCE(SUM(qty), 0),
    'unit', MAX(unit)
  ) FROM peers;
$$;
