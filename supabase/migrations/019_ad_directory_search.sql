-- Migration 019: 광고판(공급사 디렉터리) — 버티컬 + 제품 태그 + 검색 + 리드 추적
-- 목적: 공급사가 제품 카테고리/키워드로 광고 등록, 수요자가 검색으로 공급사 발견.
--       전화 등 플랫폼 외부 거래가 일어나도 '발견·신뢰·기록' 레이어로 재방문 유도(리드 추적).
-- 원칙: 추가 전용(additive). 기존 research 광고 동작 무변경.

-- 1) 광고에 버티컬 차원
ALTER TABLE supplier_ads
  ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'research';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_ads_vertical_check') THEN
    ALTER TABLE supplier_ads ADD CONSTRAINT supplier_ads_vertical_check
      CHECK (vertical IN ('research', 'aesthetic'));
  END IF;
END $$;

-- 2) 제품 태그(키워드) — 공급사가 취급 제품을 등록, 검색 대상
ALTER TABLE supplier_ads
  ADD COLUMN IF NOT EXISTS products text[] NOT NULL DEFAULT '{}';

-- 3) 통합 검색 텍스트(제목+설명+제품) — 부분검색(trgm)
ALTER TABLE supplier_ads
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (
    coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(products, ' ')
  ) STORED;

CREATE INDEX IF NOT EXISTS supplier_ads_search_trgm_idx
  ON supplier_ads USING gin (search_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS supplier_ads_vertical_valid_idx
  ON supplier_ads (vertical, valid_until DESC);

-- categories 배열 검색(겹침)용
CREATE INDEX IF NOT EXISTS supplier_ads_categories_gin_idx
  ON supplier_ads USING gin (categories);

-- =====================
-- 4) 리드 추적 (마케팅 솔루션 핵심)
--    광고 노출/전화클릭/요청클릭을 기록 → 공급사 리포트 + 수요자 재유입.
-- =====================
CREATE TABLE IF NOT EXISTS ad_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       uuid NOT NULL REFERENCES supplier_ads(id) ON DELETE CASCADE,
  viewer_id   uuid,                      -- 비로그인 가능(nullable)
  event_type  text NOT NULL,             -- view | contact_click | request_click
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_events_type_check
    CHECK (event_type IN ('view', 'contact_click', 'request_click'))
);

CREATE INDEX IF NOT EXISTS ad_events_ad_type_idx ON ad_events (ad_id, event_type, created_at DESC);

-- RLS: 누구나 이벤트 기록(INSERT) 가능, 조회는 service_role(서버 집계)만 → SELECT 정책 없음
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "이벤트 기록" ON ad_events;
CREATE POLICY "이벤트 기록" ON ad_events
  FOR INSERT WITH CHECK (true);
