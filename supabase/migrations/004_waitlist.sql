-- 연구자 대기자 이메일 수집 테이블
CREATE TABLE IF NOT EXISTS waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  name        text,
  institution text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 이메일 인덱스
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);
