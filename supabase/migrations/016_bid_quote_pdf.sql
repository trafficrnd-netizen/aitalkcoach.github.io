-- M16: 입찰 시 공급사 양식 견적 PDF 첨부 필수화
-- 공급사가 입찰할 때 자사 양식의 견적서 PDF를 업로드하고,
-- 연구자는 공급사 수락 전에 각 견적 PDF를 다운로드할 수 있다.

-- =====================
-- 1. bids: 견적 PDF 파일 메타데이터 컬럼 추가
-- =====================
ALTER TABLE bids
  ADD COLUMN IF NOT EXISTS quote_file_path text,   -- Supabase Storage 경로 (bid-quotes 버킷)
  ADD COLUMN IF NOT EXISTS quote_file_name text,   -- 원본 파일명
  ADD COLUMN IF NOT EXISTS quote_file_size int;    -- 파일 크기(bytes)

COMMENT ON COLUMN bids.quote_file_path IS '공급사 양식 견적 PDF — bid-quotes 스토리지 경로';
COMMENT ON COLUMN bids.quote_file_name IS '업로드된 견적 PDF 원본 파일명';
COMMENT ON COLUMN bids.quote_file_size IS '견적 PDF 파일 크기(bytes)';

-- =====================
-- 2. 견적 PDF 전용 비공개 스토리지 버킷 생성
-- =====================
-- 서버(서비스 롤/admin client)에서만 업로드·서명 URL 발급 → RLS 정책 불필요
INSERT INTO storage.buckets (id, name, public)
VALUES ('bid-quotes', 'bid-quotes', false)
ON CONFLICT (id) DO NOTHING;
