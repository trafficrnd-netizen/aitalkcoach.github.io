-- BidVibe 초기 스키마
-- M02: DB 스키마 마이그레이션

-- 확장 기능
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUM 타입
-- =====================

CREATE TYPE user_type AS ENUM ('researcher', 'supplier');
CREATE TYPE request_type AS ENUM ('single', 'batch');
CREATE TYPE request_status AS ENUM ('open', 'closed', 'expired', 'cancelled');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE transaction_status AS ENUM ('in_progress', 'completed', 'disputed');
CREATE TYPE supplier_plan AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE market_price_source AS ENUM ('external', 'supplier', 'transaction');
CREATE TYPE api_plan AS ENUM ('sandbox', 'starter', 'growth', 'platform', 'enterprise');

-- =====================
-- 사용자 공통
-- =====================

CREATE TABLE users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  type       user_type NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================
-- 연구자 프로필
-- =====================

CREATE TABLE researcher_profiles (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  institution text,
  department  text,
  phone       text
);

-- =====================
-- 공급자 프로필
-- =====================

CREATE TABLE supplier_profiles (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name    text NOT NULL,
  business_number text UNIQUE NOT NULL,
  verified_at     timestamptz,
  representative  text,
  address         text,
  phone           text,
  categories      text[] DEFAULT '{}',
  regions         text[] DEFAULT '{}',
  plan            supplier_plan DEFAULT 'free',
  credits         int DEFAULT 5,
  early_bird      boolean DEFAULT false
);

-- =====================
-- 견적 요청
-- =====================

CREATE TABLE requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             request_type NOT NULL,
  title            text,
  status           request_status DEFAULT 'open',
  deadline         date,
  delivery_address text,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE request_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  substance_name text NOT NULL,
  cas_number     text,
  purity         text,
  volume         text,
  qty            int NOT NULL CHECK (qty > 0),
  unit           text,
  note           text,
  search_vector  tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(substance_name, '') || ' ' || coalesce(cas_number, ''))
  ) STORED
);

-- =====================
-- 입찰/견적
-- =====================

CREATE TABLE bids (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  supplier_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_partial    boolean DEFAULT false,
  delivery_date date,
  valid_until   date,
  memo          text,
  status        bid_status DEFAULT 'pending',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (request_id, supplier_id)
);

CREATE TABLE bid_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id          uuid NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  request_item_id uuid NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
  unit_price      numeric(12,2),
  total_price     numeric(12,2),
  available       boolean DEFAULT true,
  UNIQUE (bid_id, request_item_id)
);

-- =====================
-- 거래 및 리뷰
-- =====================

CREATE TABLE transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES requests(id),
  bid_id          uuid NOT NULL REFERENCES bids(id),
  status          transaction_status DEFAULT 'in_progress',
  actual_delivery date,
  completed_at    timestamptz
);

CREATE TABLE reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  reviewer_id    uuid NOT NULL REFERENCES users(id),
  reviewee_id    uuid NOT NULL REFERENCES users(id),
  score          int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (transaction_id, reviewer_id)
);

-- =====================
-- 시장가 데이터
-- =====================

CREATE TABLE market_prices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substance_name text NOT NULL,
  cas_number     text,
  purity         text,
  volume         text,
  final_price    numeric(12,2) NOT NULL,
  source         market_price_source NOT NULL,
  recorded_at    timestamptz DEFAULT now()
);

-- =====================
-- 알림
-- =====================

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  payload    jsonb DEFAULT '{}',
  read_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================
-- PubChem 캐시 (DB 보조)
-- =====================

CREATE TABLE substance_cache (
  cas_number      text PRIMARY KEY,
  names           jsonb NOT NULL DEFAULT '[]',
  synonyms        jsonb NOT NULL DEFAULT '[]',
  molecular_weight numeric,
  fetched_at      timestamptz DEFAULT now()
);

-- =====================
-- API 키 (Stage 4)
-- =====================

CREATE TABLE api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    text UNIQUE NOT NULL,
  plan        api_plan NOT NULL DEFAULT 'sandbox',
  calls_used  int DEFAULT 0,
  calls_limit int,
  reset_at    timestamptz,
  created_at  timestamptz DEFAULT now()
);
