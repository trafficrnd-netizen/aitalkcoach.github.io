-- 해외 공급자 지원
-- M11: 국내/해외 구분 + 해외 화합물(유일대리인/한국지사) + 장비(KC인증) 처리

ALTER TABLE supplier_profiles
  -- 사업자 소재지: 'domestic' | 'overseas'
  ADD COLUMN IF NOT EXISTS origin            text NOT NULL DEFAULT 'domestic',
  -- 해외 공급 유형: 'chemical' | 'equipment' (국내는 NULL)
  ADD COLUMN IF NOT EXISTS overseas_supply_type text,
  -- 본사 소재 국가 (해외만)
  ADD COLUMN IF NOT EXISTS country           text,
  -- 화합물: 대리 형태 'only_representative' | 'korea_branch'
  ADD COLUMN IF NOT EXISTS or_type           text,
  -- 화합물: 대리인/한국지사·법인명
  ADD COLUMN IF NOT EXISTS or_company_name   text,
  -- 화합물: 대리인/한국지사·법인 사업자번호 (이 번호로 검증·가입)
  ADD COLUMN IF NOT EXISTS or_business_number text,
  -- 장비: 화학물질 내장 여부 (true면 화평법/화관법 규제)
  ADD COLUMN IF NOT EXISTS equipment_has_chemicals boolean NOT NULL DEFAULT false,
  -- 장비: KC인증·전기용품 안전인증 책임 확인 여부
  ADD COLUMN IF NOT EXISTS kc_cert_acknowledged    boolean NOT NULL DEFAULT false;

-- 제약: origin 값 검증
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_origin_check'
  ) THEN
    ALTER TABLE supplier_profiles
      ADD CONSTRAINT supplier_origin_check CHECK (origin IN ('domestic', 'overseas'));
  END IF;
END $$;

COMMENT ON COLUMN supplier_profiles.origin IS '사업자 소재지: domestic(국내) | overseas(해외)';
COMMENT ON COLUMN supplier_profiles.overseas_supply_type IS '해외 공급 유형: chemical | equipment';
COMMENT ON COLUMN supplier_profiles.or_business_number IS '유일대리인/한국지사·법인 사업자번호 (해외 화합물 공급 시 가입 기준)';
COMMENT ON COLUMN supplier_profiles.kc_cert_acknowledged IS '해외 장비 공급사의 KC인증·전기용품 안전인증 책임 확인';
