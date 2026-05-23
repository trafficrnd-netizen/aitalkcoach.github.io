-- RLS (Row Level Security) 정책
-- M02: DB 스키마 마이그레이션

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE researcher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE substance_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- =====================
-- users
-- =====================
CREATE POLICY "본인 조회" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 삽입" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================
-- researcher_profiles
-- =====================
CREATE POLICY "본인 조회" ON researcher_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 삽입" ON researcher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 수정" ON researcher_profiles FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- supplier_profiles
-- =====================
-- 자신의 프로필은 모두 가능
CREATE POLICY "본인 전체" ON supplier_profiles FOR ALL USING (auth.uid() = user_id);
-- 로그인한 연구자는 공급자 프로필 공개 필드 조회 가능 (견적 수락 후 연락처 노출용)
CREATE POLICY "연구자 조회" ON supplier_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'researcher')
);

-- =====================
-- requests (견적 요청)
-- =====================
-- 연구자: 본인 요청 전체
CREATE POLICY "연구자 본인 요청" ON requests FOR ALL USING (auth.uid() = researcher_id);
-- 공급자: open 상태 요청 조회 (입찰광장)
CREATE POLICY "공급자 open 요청 조회" ON requests FOR SELECT USING (
  status = 'open' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'supplier')
);

-- =====================
-- request_items
-- =====================
-- 연구자: 본인 요청의 품목
CREATE POLICY "연구자 본인 품목" ON request_items FOR ALL USING (
  EXISTS (SELECT 1 FROM requests WHERE id = request_id AND researcher_id = auth.uid())
);
-- 공급자: open 요청의 품목 조회
CREATE POLICY "공급자 open 품목 조회" ON request_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM requests
    WHERE id = request_id AND status = 'open'
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'supplier')
  )
);

-- =====================
-- bids (견적)
-- =====================
-- 공급자: 본인 견적 전체
CREATE POLICY "공급자 본인 견적" ON bids FOR ALL USING (auth.uid() = supplier_id);
-- 연구자: 본인 요청에 달린 견적 조회 (금액은 수락 전 숨김 처리는 앱 레이어에서)
CREATE POLICY "연구자 수신 견적 조회" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM requests WHERE id = request_id AND researcher_id = auth.uid())
);

-- =====================
-- bid_items
-- =====================
CREATE POLICY "공급자 본인 견적 품목" ON bid_items FOR ALL USING (
  EXISTS (SELECT 1 FROM bids WHERE id = bid_id AND supplier_id = auth.uid())
);
CREATE POLICY "연구자 수신 견적 품목 조회" ON bid_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bids b
    JOIN requests r ON r.id = b.request_id
    WHERE b.id = bid_id AND r.researcher_id = auth.uid()
  )
);

-- =====================
-- transactions
-- =====================
CREATE POLICY "당사자 조회" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM requests WHERE id = request_id AND researcher_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM bids WHERE id = bid_id AND supplier_id = auth.uid())
);
CREATE POLICY "당사자 수정" ON transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM requests WHERE id = request_id AND researcher_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM bids WHERE id = bid_id AND supplier_id = auth.uid())
);

-- =====================
-- reviews
-- =====================
CREATE POLICY "작성자 삽입" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "전체 조회" ON reviews FOR SELECT USING (true);

-- =====================
-- market_prices
-- =====================
CREATE POLICY "전체 조회" ON market_prices FOR SELECT USING (true);
-- 삽입은 서비스 롤만 (API Route에서 service_role 키 사용)

-- =====================
-- notifications
-- =====================
CREATE POLICY "본인 알림" ON notifications FOR ALL USING (auth.uid() = user_id);

-- =====================
-- substance_cache
-- =====================
CREATE POLICY "전체 조회" ON substance_cache FOR SELECT USING (true);

-- =====================
-- api_keys
-- =====================
CREATE POLICY "본인 API 키" ON api_keys FOR ALL USING (auth.uid() = user_id);
