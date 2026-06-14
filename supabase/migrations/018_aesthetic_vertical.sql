-- Migration 018: 에스테틱 버티컬 — vertical 차원 + 카탈로그/인증 테이블
-- 원칙: 추가 전용(additive). 기존 research 동작·RLS 회귀 없음.
-- vertical 값: 'research'(기존 기본) | 'aesthetic'

-- 제품명 부분검색(자동완성)용 트라이그램 확장
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================
-- 1) 핵심 테이블에 vertical 차원 추가 (기본값 research → 기존 데이터 무영향)
-- =====================
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'research';

ALTER TABLE bids
  ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'research';

-- CHECK 제약 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'requests_vertical_check') THEN
    ALTER TABLE requests ADD CONSTRAINT requests_vertical_check
      CHECK (vertical IN ('research', 'aesthetic'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bids_vertical_check') THEN
    ALTER TABLE bids ADD CONSTRAINT bids_vertical_check
      CHECK (vertical IN ('research', 'aesthetic'));
  END IF;
END $$;

-- 공급사가 취급하는 버티컬(복수) — 기본 research
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS verticals text[] NOT NULL DEFAULT '{research}';

-- 입찰광장 필터 인덱스
CREATE INDEX IF NOT EXISTS requests_vertical_status_idx
  ON requests (vertical, status);
CREATE INDEX IF NOT EXISTS bids_vertical_idx
  ON bids (vertical);

-- =====================
-- 2) 에스테틱 카탈로그 (전문의약품 제외)
--    category 예: device.cartridge | supply.needle | cosmetic.ampoule
-- =====================
CREATE TABLE IF NOT EXISTS aesthetic_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,                 -- 카탈로그 코드
  name        text NOT NULL,
  brand       text,
  spec        jsonb NOT NULL DEFAULT '{}',    -- 용량/규격 등
  is_device   boolean NOT NULL DEFAULT false, -- 의료기기 여부(판매 자격 분기)
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aesthetic_products_category_idx
  ON aesthetic_products (category) WHERE active;

CREATE INDEX IF NOT EXISTS aesthetic_products_name_trgm_idx
  ON aesthetic_products USING gin (name gin_trgm_ops);

-- =====================
-- 3) 공급사 인증 (유형별) — business / chem_control / med_device
-- =====================
CREATE TABLE IF NOT EXISTS supplier_certifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vertical     text NOT NULL DEFAULT 'aesthetic',
  cert_type    text NOT NULL,                 -- business | chem_control | med_device
  doc_url      text,                          -- Storage 경로
  status       text NOT NULL DEFAULT 'pending',-- pending | verified | rejected
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_certifications_type_check
    CHECK (cert_type IN ('business', 'chem_control', 'med_device')),
  CONSTRAINT supplier_certifications_status_check
    CHECK (status IN ('pending', 'verified', 'rejected'))
);

CREATE UNIQUE INDEX IF NOT EXISTS supplier_certifications_uniq
  ON supplier_certifications (supplier_id, vertical, cert_type);

CREATE INDEX IF NOT EXISTS supplier_certifications_supplier_idx
  ON supplier_certifications (supplier_id);

-- =====================
-- 4) RLS
--    requests/bids: 기존 정책이 researcher_id/supplier_id 기반이라 vertical 컬럼 추가만으로 회귀 없음.
--    신규 테이블만 RLS 정의.
-- =====================
ALTER TABLE aesthetic_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_certifications ENABLE ROW LEVEL SECURITY;

-- 카탈로그: 인증 사용자 누구나 읽기 (쓰기는 service_role만 → 정책 없음)
DROP POLICY IF EXISTS "카탈로그 읽기" ON aesthetic_products;
CREATE POLICY "카탈로그 읽기" ON aesthetic_products
  FOR SELECT USING (active);

-- 인증: 공급사는 본인 것만 조회/삽입/수정 (관리자는 service_role로 우회)
DROP POLICY IF EXISTS "인증 본인 조회" ON supplier_certifications;
CREATE POLICY "인증 본인 조회" ON supplier_certifications
  FOR SELECT USING (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "인증 본인 삽입" ON supplier_certifications;
CREATE POLICY "인증 본인 삽입" ON supplier_certifications
  FOR INSERT WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "인증 본인 수정" ON supplier_certifications;
CREATE POLICY "인증 본인 수정" ON supplier_certifications
  FOR UPDATE USING (auth.uid() = supplier_id);
