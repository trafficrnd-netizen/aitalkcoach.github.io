-- 공급자 광고 게시판
CREATE TABLE IF NOT EXISTS supplier_ads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  categories   text[] NOT NULL DEFAULT '{}',
  regions      text[] NOT NULL DEFAULT '{}',
  contact_info text,
  valid_until  date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE supplier_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_ads_read_all"   ON supplier_ads FOR SELECT USING (true);
CREATE POLICY "supplier_ads_insert_own" ON supplier_ads FOR INSERT WITH CHECK (auth.uid() = supplier_id);
CREATE POLICY "supplier_ads_update_own" ON supplier_ads FOR UPDATE USING (auth.uid() = supplier_id);
CREATE POLICY "supplier_ads_delete_own" ON supplier_ads FOR DELETE USING (auth.uid() = supplier_id);

CREATE INDEX IF NOT EXISTS supplier_ads_valid_until_idx ON supplier_ads (valid_until DESC);
CREATE INDEX IF NOT EXISTS supplier_ads_supplier_idx ON supplier_ads (supplier_id);

-- 리뷰 다차원 평가 컬럼 추가
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS price_score        smallint CHECK (price_score        BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS delivery_score     smallint CHECK (delivery_score     BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS communication_score smallint CHECK (communication_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS reviewer_role      text NOT NULL DEFAULT 'researcher';

-- 기존 score 컬럼 = overall_score 역할 유지
