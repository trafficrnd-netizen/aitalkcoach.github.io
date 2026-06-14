-- Migration 020: 에스테틱 버티컬 — 의원(Clinic) 프로필 테이블
-- 원칙: 추가 전용(additive). 기존 researcher/supplier 동작 무영향.
-- 의원은 에스테틱 버티컬의 "요청자" 역할. user_type='clinic'

-- =====================
-- 1) clinic_profiles 테이블
-- =====================
CREATE TABLE IF NOT EXISTS clinic_profiles (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  clinic_name     text NOT NULL,
  business_number text UNIQUE NOT NULL,
  representative  text,
  address         text,
  phone           text,
  contact_name    text,
  contact_phone   text UNIQUE,
  vertical        text NOT NULL DEFAULT 'aesthetic',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinic_profiles_vertical_idx
  ON clinic_profiles (vertical);

-- =====================
-- 2) RLS
-- =====================
ALTER TABLE clinic_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회
DROP POLICY IF EXISTS "클리닉 본인 조회" ON clinic_profiles;
CREATE POLICY "클리닉 본인 조회" ON clinic_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 프로필 삽입 (가입 시 service_role로 처리하므로 INSERT 정책은 service_role 우회)
DROP POLICY IF EXISTS "클리닉 본인 수정" ON clinic_profiles;
CREATE POLICY "클리닉 본인 수정" ON clinic_profiles
  FOR UPDATE USING (auth.uid() = user_id);
