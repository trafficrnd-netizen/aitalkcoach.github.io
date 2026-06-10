-- 자전거래방지: 같은 사용자가 연구자+공급자 계정 모두 보유 시 자가 입찰 차단
-- INSERT/UPDATE 시 bids 테이블에 적용

CREATE OR REPLACE FUNCTION prevent_self_bid_func()
RETURNS TRIGGER AS $$
BEGIN
  -- 요청의 researcher_id와 입찰자의 supplier_id가 같으면 차단
  IF EXISTS (
    SELECT 1 FROM requests
    WHERE id = NEW.request_id AND researcher_id = NEW.supplier_id
  ) THEN
    RAISE EXCEPTION '자신이 등록한 요청에는 입찰할 수 없습니다.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER bids_prevent_self_bid
  BEFORE INSERT OR UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_bid_func();