-- Migration 021: BidMedi 흥정·크레딧·광고·그룹바이
-- 원칙: 추가 전용(additive). 기존 동작 무영향.

-- =====================
-- 1. requests — 흥정 허용 옵션
-- =====================
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS allow_negotiation boolean NOT NULL DEFAULT false;

-- =====================
-- 2. negotiations — 흥정 협상 이력
-- =====================
CREATE TABLE IF NOT EXISTS negotiations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  bid_id           uuid NOT NULL REFERENCES bids(id)     ON DELETE CASCADE,
  clinic_id        uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  supplier_id      uuid NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  competitor_url   text,
  competitor_price integer,   -- 경쟁사 가격 (원)
  message          text,
  status           text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  expires_at       timestamptz NOT NULL,  -- 수락 후 12시간
  created_at       timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz,
  UNIQUE (bid_id)              -- 입찰당 흥정 1회
);

CREATE INDEX IF NOT EXISTS negotiations_clinic_idx
  ON negotiations (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS negotiations_supplier_idx
  ON negotiations (supplier_id, status);

ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "흥정_의원조회"   ON negotiations;
DROP POLICY IF EXISTS "흥정_공급사조회" ON negotiations;
DROP POLICY IF EXISTS "흥정_의원생성"   ON negotiations;
DROP POLICY IF EXISTS "흥정_공급사수정" ON negotiations;

CREATE POLICY "흥정_의원조회"   ON negotiations FOR SELECT USING (auth.uid() = clinic_id);
CREATE POLICY "흥정_공급사조회" ON negotiations FOR SELECT USING (auth.uid() = supplier_id);
CREATE POLICY "흥정_의원생성"   ON negotiations FOR INSERT WITH CHECK (auth.uid() = clinic_id);
CREATE POLICY "흥정_공급사수정" ON negotiations FOR UPDATE  USING (auth.uid() = supplier_id);

-- =====================
-- 3. clinic_profiles — 크레딧 컬럼
-- =====================
ALTER TABLE clinic_profiles
  ADD COLUMN IF NOT EXISTS credits int NOT NULL DEFAULT 0;

-- credit_rules 에 clinic 역할 허용 (기존 CHECK 교체)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_rules_role_check'
  ) THEN
    ALTER TABLE credit_rules DROP CONSTRAINT credit_rules_role_check;
  END IF;
  ALTER TABLE credit_rules ADD CONSTRAINT credit_rules_role_check
    CHECK (role IN ('researcher', 'supplier', 'clinic', 'medi-supplier'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- 의원 크레딧 적립 규칙 기본값 삽입
INSERT INTO credit_rules (key, role, label, description, points, frequency_type, sort_order)
VALUES
  ('clinic_first_request', 'clinic', '첫 견적 요청',   '첫 번째 견적 요청 등록',       30, 'once',      1),
  ('clinic_bid_received',  'clinic', '입찰 3건 수신',   '요청에 3개 이상의 입찰 도착',   10, 'per_event', 2),
  ('clinic_deal_done',     'clinic', '거래 완료',        '견적 수락 완료',               20, 'per_event', 3),
  ('clinic_invite_friend', 'clinic', '친구 초대 성공',   '초대 링크로 의원 가입 완료',   50, 'per_event', 4)
ON CONFLICT (key) DO NOTHING;

-- =====================
-- 4. medi_group_buys — 에스테틱 그룹바이
-- =====================
CREATE TABLE IF NOT EXISTS medi_group_buys (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code     text NOT NULL,
  product_name     text NOT NULL,
  product_type     text,
  min_participants int  NOT NULL DEFAULT 3,
  current_count    int  NOT NULL DEFAULT 0,
  target_price     integer,         -- 목표 단가 (원)
  unit             text NOT NULL DEFAULT 'ea',
  status           text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  expires_at       timestamptz,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medi_group_buy_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id  uuid NOT NULL REFERENCES medi_group_buys(id) ON DELETE CASCADE,
  clinic_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qty           int  NOT NULL DEFAULT 1,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_buy_id, clinic_id)
);

ALTER TABLE medi_group_buys             ENABLE ROW LEVEL SECURITY;
ALTER TABLE medi_group_buy_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "그룹바이_전체조회"  ON medi_group_buys;
DROP POLICY IF EXISTS "그룹바이_생성"      ON medi_group_buys;
DROP POLICY IF EXISTS "그룹바이_참여조회"  ON medi_group_buy_participants;
DROP POLICY IF EXISTS "그룹바이_참여등록"  ON medi_group_buy_participants;
DROP POLICY IF EXISTS "그룹바이_참여취소"  ON medi_group_buy_participants;

CREATE POLICY "그룹바이_전체조회" ON medi_group_buys             FOR SELECT USING (true);
CREATE POLICY "그룹바이_생성"     ON medi_group_buys             FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "그룹바이_참여조회" ON medi_group_buy_participants FOR SELECT USING (true);
CREATE POLICY "그룹바이_참여등록" ON medi_group_buy_participants FOR INSERT WITH CHECK (auth.uid() = clinic_id);
CREATE POLICY "그룹바이_참여취소" ON medi_group_buy_participants FOR DELETE USING  (auth.uid() = clinic_id);

-- 샘플 그룹바이 데이터 (오픈 이벤트용)
INSERT INTO medi_group_buys (product_code, product_name, product_type, min_participants, target_price, unit, expires_at)
VALUES
  ('device.cartridge', '레이저/HIFU/RF 카트리지', 'device', 5, 35000, 'ea',
   now() + interval '14 days'),
  ('pack.modeling',    '모델링팩/석고팩 1kg',      'pack',   5, 8000,  'kg',
   now() + interval '10 days'),
  ('hygiene.glove',    '니트릴 장갑 100매/박스',   'hygiene', 3, 4500,  'box',
   now() + interval '7 days')
ON CONFLICT DO NOTHING;
