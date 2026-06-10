-- M17: 견적 PDF 다운로드 추적 + 24시간 후 서버 자동 삭제
-- 연구자가 비교용으로 견적 PDF를 그 자리에서 다운로드하면 기록을 남기고,
-- 다운로드 후 24시간이 지나면 서버(bid-quotes 버킷)에서 자동 삭제한다.
-- 어드민은 다운로드 기록·낙찰가·거래경과를 모니터링한다.

ALTER TABLE bids
  ADD COLUMN IF NOT EXISTS quote_downloaded_at      timestamptz,          -- 최초 다운로드 시각
  ADD COLUMN IF NOT EXISTS quote_last_downloaded_at timestamptz,          -- 마지막 다운로드 시각
  ADD COLUMN IF NOT EXISTS quote_download_count     int NOT NULL DEFAULT 0, -- 다운로드 횟수
  ADD COLUMN IF NOT EXISTS quote_deleted_at         timestamptz;          -- 서버에서 PDF 삭제된 시각

COMMENT ON COLUMN bids.quote_downloaded_at      IS '연구자가 견적 PDF를 최초로 다운로드한 시각';
COMMENT ON COLUMN bids.quote_last_downloaded_at IS '연구자가 견적 PDF를 마지막으로 다운로드한 시각';
COMMENT ON COLUMN bids.quote_download_count     IS '견적 PDF 누적 다운로드 횟수';
COMMENT ON COLUMN bids.quote_deleted_at         IS '다운로드 후 24시간 경과로 서버에서 PDF가 삭제된 시각';

-- 24시간 경과분 자동 삭제 cron 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_bids_quote_purge
  ON bids (quote_downloaded_at)
  WHERE quote_file_path IS NOT NULL AND quote_deleted_at IS NULL;
