-- 가입 채널 추적 (UTM)
-- M10: 마케팅 채널별 가입 전환율 분석

CREATE TABLE IF NOT EXISTS signup_attribution (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL,                       -- 'researcher' | 'supplier'
  utm_source   text,                                -- threads | discord | everytime | dc | naver | direct
  utm_medium   text,                                -- social | community | search | referral
  utm_campaign text,                                -- 캠페인 이름
  utm_content  text,                                -- A2 | A7 | A10 | landing1 등
  utm_term     text,                                -- 키워드
  landing_path text,                                -- /landing1 | /landing2 | /
  referrer     text,                                -- document.referrer
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signup_attribution_source_idx ON signup_attribution(utm_source);
CREATE INDEX IF NOT EXISTS signup_attribution_created_idx ON signup_attribution(created_at DESC);

ALTER TABLE signup_attribution ENABLE ROW LEVEL SECURITY;

-- 본인만 자기 attribution 조회 가능 + service_role 전체 접근
CREATE POLICY "users_read_own_attribution" ON signup_attribution
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service_role_full_attribution" ON signup_attribution
  FOR ALL USING (auth.role() = 'service_role');
