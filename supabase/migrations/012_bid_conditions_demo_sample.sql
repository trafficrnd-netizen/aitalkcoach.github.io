-- 입찰 조건 명시 + 데모/샘플 + 평가기한(데모 반영) + 피드백 크레딧
-- M12: 견적 경험 개선

-- =====================
-- 1. bids: 공급사가 입찰 시 조건을 명시 (낭패 방지)
-- =====================
ALTER TABLE bids
  ADD COLUMN IF NOT EXISTS lead_time_days        int,                    -- 예상 납기(일); 해외는 통관 포함
  ADD COLUMN IF NOT EXISTS customs_duty_included  boolean,               -- 관세·수입부가세 포함 여부(해외)
  ADD COLUMN IF NOT EXISTS cert_responsibility_ack boolean DEFAULT false, -- KC·전기안전 인증 책임 확인(해외 장비)
  ADD COLUMN IF NOT EXISTS demo_available        boolean,                -- 데모 사용 가능 여부(장비)
  ADD COLUMN IF NOT EXISTS demo_days             int,                    -- 데모 기간(일)(장비)
  ADD COLUMN IF NOT EXISTS sample_available      boolean,                -- 샘플 제공 여부(시약/단백질·펩타이드)
  ADD COLUMN IF NOT EXISTS conditions_note       text;                   -- 기타 제시 조건

COMMENT ON COLUMN bids.lead_time_days IS '예상 납기(일). 해외 공급사는 통관 기간 포함';
COMMENT ON COLUMN bids.demo_days IS '장비 데모 사용 기간(일). 거래 만료·평가 기한에 반영';
COMMENT ON COLUMN bids.sample_available IS '시약·단백질·펩타이드 샘플 제공 여부';

-- =====================
-- 2. transactions: 평가/만료 기한에 데모 기간 반영
-- =====================
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS demo_days       int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_deadline timestamptz;   -- 낙찰 + 데모기간 + 기본 평가창

COMMENT ON COLUMN transactions.review_deadline IS '거래 만료/평가 기한 = 낙찰일 + 데모기간 + 기본 평가창(14일)';

-- =====================
-- 3. requests: 자동 만료 처리 지원 (status enum에 expired는 이미 존재)
-- =====================
-- 별도 컬럼 불필요 — deadline + status='open' 조합으로 cron이 만료 처리

-- =====================
-- 4. 크레딧: 데모·샘플 피드백 제공 시 2점 보상
-- =====================
INSERT INTO credit_rules (key, role, label, description, points, frequency_type, frequency_limit, active, sort_order)
VALUES (
  'researcher_demo_sample_feedback', 'researcher',
  '데모·샘플 피드백 제공',
  '장비 데모 또는 시약·단백질/펩타이드 샘플 사용 후 피드백(리뷰) 제출 시 보상',
  2, 'per_event', NULL, true, 15
)
ON CONFLICT (key) DO UPDATE SET points = 2, active = true, label = EXCLUDED.label, description = EXCLUDED.description;
