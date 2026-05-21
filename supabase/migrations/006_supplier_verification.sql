-- Migration 006: supplier_profiles 누락 컬럼 추가 + 인증 상태 관리
-- verification_status: 'instant' (도메인 이메일 즉시 인증) | 'pending' (서류 심사 대기) | 'approved' (승인) | 'rejected' (거절)

ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS handles_hazmat     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hazmat_license_no  text,
  ADD COLUMN IF NOT EXISTS contact_name       text,
  ADD COLUMN IF NOT EXISTS contact_phone      text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'instant';

-- contact_phone unique (동일 담당자 중복 가입 방지)
CREATE UNIQUE INDEX IF NOT EXISTS supplier_profiles_contact_phone_key
  ON supplier_profiles (contact_phone)
  WHERE contact_phone IS NOT NULL;

-- 심사 대기 목록 조회 인덱스
CREATE INDEX IF NOT EXISTS supplier_profiles_verification_status_idx
  ON supplier_profiles (verification_status)
  WHERE verification_status = 'pending';
