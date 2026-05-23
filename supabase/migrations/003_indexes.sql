-- 인덱스
-- M02: DB 스키마 마이그레이션

-- requests
CREATE INDEX idx_requests_researcher ON requests(researcher_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_deadline ON requests(deadline);
CREATE INDEX idx_requests_created ON requests(created_at DESC);

-- request_items (FTS)
CREATE INDEX idx_request_items_search ON request_items USING GIN(search_vector);
CREATE INDEX idx_request_items_cas ON request_items(cas_number);
CREATE INDEX idx_request_items_request ON request_items(request_id);

-- bids
CREATE INDEX idx_bids_request ON bids(request_id);
CREATE INDEX idx_bids_supplier ON bids(supplier_id);
CREATE INDEX idx_bids_status ON bids(status);

-- bid_items
CREATE INDEX idx_bid_items_bid ON bid_items(bid_id);
CREATE INDEX idx_bid_items_request_item ON bid_items(request_item_id);

-- transactions
CREATE INDEX idx_transactions_request ON transactions(request_id);
CREATE INDEX idx_transactions_bid ON transactions(bid_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- market_prices
CREATE INDEX idx_market_prices_cas ON market_prices(cas_number);
CREATE INDEX idx_market_prices_name ON market_prices(substance_name);
CREATE INDEX idx_market_prices_source ON market_prices(source);

-- substance_cache
CREATE INDEX idx_substance_cache_fetched ON substance_cache(fetched_at);
