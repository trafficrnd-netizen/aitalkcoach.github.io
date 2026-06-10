-- BidVibe 크레딧 시스템 마이그레이션
-- M07: 크레딧/쿼터 + 알림 이메일 + 알림 컬럼 추가

-- =====================
-- A-1. 컬럼 추가
-- =====================

-- researcher_profiles: credits, early_bird, notification_emails
ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS credits              INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_bird          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_emails   JSONB NOT NULL DEFAULT '[]'::jsonb;
-- notification_emails 형식: [{ "email": "...", "label": "...", "verified": false, "created_at": "..." }]

-- supplier_profiles: credits (이미 있을 수 있음 — IF NOT EXISTS)
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 0;

-- =====================
-- A-2. 신규 테이블 3종
-- =====================

-- credit_rules: 적립행위 규칙
CREATE TABLE IF NOT EXISTS credit_rules (
  key              TEXT PRIMARY KEY,
  role             TEXT NOT NULL CHECK (role IN ('researcher','supplier')),
  label            TEXT NOT NULL,
  description      TEXT,
  points           INT NOT NULL,
  frequency_type   TEXT NOT NULL DEFAULT 'per_event',  -- per_event|daily|weekly|monthly|once
  frequency_limit  INT,
  active           BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- credit_ledger: 크레딧 원장
CREATE TABLE IF NOT EXISTS credit_ledger (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_key      TEXT,
  delta         INT NOT NULL,
  balance_after INT NOT NULL,
  reason        TEXT,
  ref_table     TEXT,
  ref_id        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_user_idx ON credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_rule_idx  ON credit_ledger(rule_key, created_at DESC);

-- quota_settings: 역할별 쿼터 설정
CREATE TABLE IF NOT EXISTS quota_settings (
  role                TEXT PRIMARY KEY CHECK (role IN ('researcher','supplier')),
  period              TEXT NOT NULL DEFAULT 'week',
  early_bird_quota    INT NOT NULL,
  normal_quota        INT NOT NULL,
  dynamic_enabled     BOOLEAN NOT NULL DEFAULT false,
  dynamic_formula     JSONB,
  updated_at          TIMESTAMPTZ DEFAULT now()
);
-- 시드: researcher 정적(얼리버드 2/주, 보통 1/주), supplier 동적
INSERT INTO quota_settings VALUES
  ('researcher','week', 2, 1, false, NULL, now()),
  ('supplier','week', 10, 5, true,
    '{"base":5,"per_researcher":0.5,"max":50,"min":5,"early_bird_bonus":2}'::jsonb, now())
ON CONFLICT (role) DO NOTHING;

-- =====================
-- A-3. RPC 함수
-- =====================

-- 적립 RPC: 빈도 제한 체크 + 잔액 갱신 + 원장 기록 (트랜잭션)
CREATE OR REPLACE FUNCTION award_credits(
  p_user_id     UUID,
  p_rule_key    TEXT,
  p_role        TEXT,
  p_ref_table   TEXT DEFAULT NULL,
  p_ref_id      TEXT DEFAULT NULL
) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rule         credit_rules%ROWTYPE;
  v_recent_count INT;
  v_new_balance  INT;
BEGIN
  SELECT * INTO v_rule FROM credit_rules WHERE key = p_rule_key AND active = true;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- 빈도 제한 체크
  IF v_rule.frequency_type = 'once' THEN
    SELECT COUNT(*) INTO v_recent_count FROM credit_ledger
      WHERE user_id = p_user_id AND rule_key = p_rule_key;
    IF v_recent_count > 0 THEN RETURN 0; END IF;

  ELSIF v_rule.frequency_type IN ('daily','weekly','monthly') THEN
    SELECT COUNT(*) INTO v_recent_count FROM credit_ledger
      WHERE user_id = p_user_id AND rule_key = p_rule_key
        AND created_at > now() - (
          CASE v_rule.frequency_type
            WHEN 'daily'   THEN INTERVAL '1 day'
            WHEN 'weekly'  THEN INTERVAL '7 days'
            WHEN 'monthly' THEN INTERVAL '30 days'
          END);
    IF v_recent_count >= COALESCE(v_rule.frequency_limit, 1) THEN RETURN 0; END IF;
  END IF;

  -- 잔액 갱신
  IF p_role = 'researcher' THEN
    UPDATE researcher_profiles SET credits = credits + v_rule.points
      WHERE user_id = p_user_id RETURNING credits INTO v_new_balance;
  ELSE
    UPDATE supplier_profiles SET credits = credits + v_rule.points
      WHERE user_id = p_user_id RETURNING credits INTO v_new_balance;
  END IF;

  -- 원장 기록
  INSERT INTO credit_ledger(user_id, rule_key, delta, balance_after, reason, ref_table, ref_id)
    VALUES (p_user_id, p_rule_key, v_rule.points, v_new_balance, v_rule.label, p_ref_table, p_ref_id);

  RETURN v_rule.points;
END; $$;

-- 차감 RPC
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount  INT,
  p_role    TEXT,
  p_reason  TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_balance INT; v_new INT;
BEGIN
  IF p_role = 'researcher' THEN
    SELECT credits INTO v_balance FROM researcher_profiles WHERE user_id = p_user_id;
  ELSE
    SELECT credits INTO v_balance FROM supplier_profiles WHERE user_id = p_user_id;
  END IF;
  IF v_balance < p_amount THEN RETURN false; END IF;

  IF p_role = 'researcher' THEN
    UPDATE researcher_profiles SET credits = credits - p_amount
      WHERE user_id = p_user_id RETURNING credits INTO v_new;
  ELSE
    UPDATE supplier_profiles SET credits = credits - p_amount
      WHERE user_id = p_user_id RETURNING credits INTO v_new;
  END IF;

  INSERT INTO credit_ledger(user_id, delta, balance_after, reason)
    VALUES (p_user_id, -p_amount, v_new, p_reason);
  RETURN true;
END; $$;

-- 동적 쿼터 계산 RPC
CREATE OR REPLACE FUNCTION get_effective_quota(
  p_role           TEXT,
  p_early_bird     BOOLEAN,
  p_researcher_cnt INT DEFAULT 0
) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_setting   quota_settings%ROWTYPE;
  v_formula   JSONB;
  v_base      NUMERIC;
  v_per_res   NUMERIC;
  v_min       INT;
  v_max       INT;
  v_bonus     INT;
BEGIN
  SELECT * INTO v_setting FROM quota_settings WHERE role = p_role;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF NOT v_setting.dynamic_enabled THEN
    RETURN CASE WHEN p_early_bird THEN v_setting.early_bird_quota ELSE v_setting.normal_quota END;
  END IF;

  v_formula := COALESCE(v_setting.dynamic_formula, '{}'::jsonb);
  v_base    := COALESCE((v_formula->>'base')::NUMERIC, 0);
  v_per_res := COALESCE((v_formula->>'per_researcher')::NUMERIC, 0);
  v_min     := COALESCE((v_formula->>'min')::INT, 0);
  v_max     := COALESCE((v_formula->>'max')::INT, 999);
  v_bonus   := COALESCE((v_formula->>'early_bird_bonus')::INT, 0);

  RETURN LEAST(v_max, GREATEST(v_min, FLOOR(v_base + v_per_res * p_researcher_cnt)::INT)
         + CASE WHEN p_early_bird THEN v_bonus ELSE 0 END;
END; $$;

-- =====================
-- A-4. credit_rules 시드 데이터 (13종)
-- =====================

-- 고매력 6종: active=true
INSERT INTO credit_rules (key, role, label, description, points, frequency_type, frequency_limit, active, sort_order) VALUES
  ('researcher_review_outcome',  'researcher', '거래 후 연구결과 리뷰',   '거래 완료 후 Good/Bad 리뷰 제출',               1, 'per_event', NULL, true,  10),
  ('researcher_invite_signup',   'researcher', '지인 초대 가입완료',       '초대 코드로 지인이 가입완료',                   5, 'per_event', NULL, true,  20),
  ('researcher_profile_complete','researcher', '프로필 100% 완성',         '프로필 항목 전체 작성 완료',                   3, 'once',      NULL, true,  30),
  ('supplier_fast_response',     'supplier',   '1시간 내 견적응답',       '견적 요청 후 1시간 내 첫 견적 제출',           2, 'per_event', NULL, true,  10),
  ('supplier_transaction_complete','supplier',  '거래 완료',               '낙찰 후 거래 완료 처리',                       3, 'per_event', NULL, true,  20),
  ('supplier_high_rating',       'supplier',   '평점 4점 이상 받기',     '거래 상대방으로부터 4점 이상 리뷰 받기',        2, 'per_event', NULL, true,  30)
ON CONFLICT (key) DO NOTHING;

-- 비활성 7종: Admin에서 활성화만 클릭하면 즉시 사용 가능
INSERT INTO credit_rules (key, role, label, description, points, frequency_type, frequency_limit, active, sort_order) VALUES
  ('researcher_first_quote',       'researcher', '첫 번째 견적요청',      '처음으로 견적 요청 게시',                       2, 'once',      NULL, false, 40),
  ('researcher_transaction_complete','researcher','거래 완료',             '낙찰 후 거래 완료 처리',                       2, 'per_event', NULL, false, 50),
  ('researcher_weekly_login',      'researcher', '주간 로그인',            '7天内 로그인',                                  1, 'weekly',    1,    false, 60),
  ('supplier_profile_update',      'supplier',   '프로필 정보 갱신',       '공급자 프로필 정보 수정',                       1, 'weekly',    1,    false, 40),
  ('supplier_hazmat_verified',    'supplier',   '위험물 인증 완료',       '유해화학물질 판매업 허가 인증',                5, 'once',      NULL, false, 50),
  ('supplier_new_customer',       'supplier',   '새 고객 확보',          '첫 거래 성사',                                  3, 'per_event', NULL, false, 60),
  ('supplier_catalog_upload',      'supplier',   '카탈로그 업로드',        '취급 제품 카탈로그 자료 등록',                   2, 'weekly',    2,    false, 70)
ON CONFLICT (key) DO NOTHING;