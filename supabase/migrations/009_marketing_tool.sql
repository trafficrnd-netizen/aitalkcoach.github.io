-- BidVibe 마케팅 툴 — 콘텐츠 큐 + 시나리오 카탈로그
-- M09: 마케팅 자동화 (Threads/Discord) 지원

-- =====================
-- 1. 콘텐츠 큐
-- =====================
-- Threads 발행 대기 콘텐츠 큐
CREATE TABLE IF NOT EXISTS content_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform     text NOT NULL DEFAULT 'threads',  -- 'threads' (향후 'discord' 등 확장)
  format       text NOT NULL,                     -- 'A2' | 'A7' | 'A9' | 'A10'
  -- 콘텐츠 본문
  title        text,                              -- 1단 임팩트 한 줄
  subtitle     text,                              -- 2단 부연
  cta_line     text DEFAULT 'BidVibe — ai-traffic.kr/landing1',
  -- A10 전용
  scenario_id  text,                              -- 시나리오 카탈로그 ID (A-1, B-2 등)
  character    text,                              -- 'kim_researcher' | 'lab_group'
  illustration_url text,                          -- 베이스 일러스트 URL (Humaaans/Storyset)
  -- 발행
  scheduled_at timestamptz NOT NULL,
  posted_at    timestamptz,
  external_id  text,                              -- Threads post ID
  external_url text,                              -- 발행된 게시물 URL
  error        text,                              -- 발행 실패 시 메시지
  -- 성과 (24·72시간 후 폴링)
  metrics      jsonb DEFAULT '{}'::jsonb,         -- { impressions, likes, replies, reposts }
  metrics_polled_at timestamptz,
  -- 메타
  created_by   text DEFAULT 'admin',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_queue_pending_idx
  ON content_queue(scheduled_at)
  WHERE posted_at IS NULL;

CREATE INDEX IF NOT EXISTS content_queue_polling_idx
  ON content_queue(posted_at)
  WHERE posted_at IS NOT NULL AND metrics_polled_at IS NULL;

-- =====================
-- 2. 시나리오 카탈로그 (A10 밈 시리즈)
-- =====================
-- 미리 정의된 12종 시나리오 풀. 관리자가 큐에 등록 시 여기서 선택.
CREATE TABLE IF NOT EXISTS meme_scenarios (
  id           text PRIMARY KEY,                  -- 'A-1', 'B-2' 등
  category     text NOT NULL,                     -- 'A_time_waste' | 'B_inefficient' | 'C_mistake' | 'D_comparison'
  character    text NOT NULL DEFAULT 'kim_researcher',  -- 'kim_researcher' | 'lab_group'
  scene_desc   text NOT NULL,                     -- 일러스트 장면 설명 (관리자 참고용)
  default_title    text NOT NULL,                 -- 기본 1단 텍스트
  default_subtitle text NOT NULL,                 -- 기본 2단 텍스트
  default_cta      text NOT NULL,                 -- 기본 3단 CTA
  active       boolean DEFAULT true,
  last_used_at timestamptz,                       -- 동일 시나리오 3개월 간격 제어
  created_at   timestamptz DEFAULT now()
);

-- 시드: 12종 시나리오 카탈로그 (05_a10_meme_structure.md 기반)
INSERT INTO meme_scenarios (id, category, character, scene_desc, default_title, default_subtitle, default_cta) VALUES
  ('A-1', 'A_time_waste',   'kim_researcher', '수화기 들고 메모 받아적는 김연구', '오후 3시 23분. 5번째 회사 통화.', '"네... NaCl 99.5% 500g 단가요... 네... 결제 조건은... 부가세는..."', 'BidVibe — 한 번 요청, 5개 견적 / ai-traffic.kr/landing1'),
  ('A-2', 'A_time_waste',   'kim_researcher', '새벽에 모니터 앞 엑셀 검산', '새벽 2시 17분. 엑셀 50줄, 다섯 번째 검산.', '"운임은 별도... 한 곳은 부가세 별도, 한 곳은 포함... 이거 통일 안 되나"', 'BidVibe — 비교는 자동으로 / ai-traffic.kr/landing1'),
  ('A-3', 'A_time_waste',   'kim_researcher', '이메일 인박스 새로고침 0건', '지난주 보낸 견적 문의 5건. 월요일 아침. 회신 0건.', '"다들 휴가 가신 건가..."', 'BidVibe — 빠르면 1시간 안에 / ai-traffic.kr/landing1'),
  ('B-1', 'B_inefficient',  'kim_researcher', '종이뭉치 들고 결재 입실', '같은 견적서, 6번째 결재 입실.', '"이번엔 통과되겠지..." "한 줄 수정해 오랍니다."', 'BidVibe — 비교 자료 자동 정리 / ai-traffic.kr/landing1'),
  ('B-2', 'B_inefficient',  'kim_researcher', '같은 정보 다른 양식 입력', '같은 제품. 다섯 번째 견적서 양식.', '회사마다 양식 다 다름. 결제 조건도 다 다름. 운임 별도/포함도 다 다름.', 'BidVibe — 양식 하나로 통일 / ai-traffic.kr/landing1'),
  ('B-3', 'B_inefficient',  'kim_researcher', 'PDF 카탈로그 스크롤', '카탈로그 PDF 100쪽 스크롤 중.', '"이 시약 단가 어디 있더라..." "이미지 PDF라 Ctrl+F도 안 됨."', 'BidVibe — 한 줄 입력으로 검색 / ai-traffic.kr/landing1'),
  ('C-1', 'C_mistake',      'kim_researcher', '봉투 들고 망연자실', '수량을 g으로 적어야 했는데 mg으로 적어서 환불 처리 중.', '"1000배 차이..."', 'BidVibe — 단위 자동 검증 / ai-traffic.kr/landing1'),
  ('C-2', 'C_mistake',      'kim_researcher', '핸드폰 보다 머리 짚음', '사놓고 보니 다른 회사가 30% 더 저렴했음.', '"왜 그 회사엔 안 물어봤지..."', 'BidVibe — 모든 공급사가 자동 입찰 / ai-traffic.kr/landing1'),
  ('C-3', 'C_mistake',      'kim_researcher', '이메일과 시계 보며 절망', '마감 직전. "죄송하지만 재고가 없습니다."', '"어제까지는 있다고 하셨잖아요..."', 'BidVibe — 실시간 재고 표시 / ai-traffic.kr/landing1'),
  ('D-1', 'D_comparison',   'lab_group',      'Before: 책상 더미 / After: 클릭', '전통 방식 일주일 vs BidVibe 1시간', '연구실 5곳 평균 데이터 기준', 'ai-traffic.kr/landing1'),
  ('D-2', 'D_comparison',   'lab_group',      '수화기 5개 vs 키보드 1개', '공급사 5곳 전화 → 견적 요청 1번', '같은 결과, 시간만 ½', 'BidVibe — ai-traffic.kr/landing1'),
  ('D-3', 'D_comparison',   'lab_group',      '영수증 무더기에 파묻힘',  '결산 시즌. 1년치 구매 영수증 정리.', '"내가 이걸 다 샀었구나..." "근데 합계가 안 맞네."', 'BidVibe — 구매 내역 자동 정리 / ai-traffic.kr/landing1')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- 3. Discord FAQ (Pro 확장 — 핀 메시지 자동 갱신)
-- =====================
CREATE TABLE IF NOT EXISTS discord_faq (
  id          bigserial PRIMARY KEY,
  category    text NOT NULL,
  question    text NOT NULL,
  answer      text NOT NULL,
  channel_id  text NOT NULL,    -- Discord 채널 ID
  message_id  text,             -- 핀된 메시지 ID
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discord_faq_category_idx ON discord_faq(category);

-- =====================
-- 4. RLS
-- =====================
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_faq ENABLE ROW LEVEL SECURITY;

-- service_role 만 접근
CREATE POLICY "service_role_full_content_queue" ON content_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_full_meme_scenarios" ON meme_scenarios
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_full_discord_faq" ON discord_faq
  FOR ALL USING (auth.role() = 'service_role');

-- =====================
-- 4. 트리거 — updated_at 자동 갱신
-- =====================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_queue_touch ON content_queue;
CREATE TRIGGER content_queue_touch
  BEFORE UPDATE ON content_queue
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
