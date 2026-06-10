-- 공급자 추천 프로그램 — 10명+ 연구자 초대 시 전용 코드 발급
-- M13: 추천 → 전용 채널 → Pro 전환 트리거

-- =====================
-- 1. supplier_profiles: 전용 코드
-- =====================
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS referral_code           text,
  ADD COLUMN IF NOT EXISTS referral_code_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code_active    boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS supplier_profiles_referral_code_idx
  ON supplier_profiles(referral_code) WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN supplier_profiles.referral_code IS '공급자 전용 채널 코드 (10명+ 인증 연구자 초대 시 발급)';
COMMENT ON COLUMN supplier_profiles.referral_code_active IS '활성 여부 — 얼리버드 후엔 Pro 이상만 활성 유지';

-- =====================
-- 2. requests: 전용 채널 마커
-- =====================
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS preferred_supplier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS via_supplier_code     text;

CREATE INDEX IF NOT EXISTS requests_preferred_supplier_idx
  ON requests(preferred_supplier_id) WHERE preferred_supplier_id IS NOT NULL;

COMMENT ON COLUMN requests.preferred_supplier_id IS '공급자 전용 채널로 들어온 요청 — 해당 공급자에게 우선 통지';

-- =====================
-- 3. 연구자→공급자 팔로우 (전용 채널 사용 동의)
-- =====================
CREATE TABLE IF NOT EXISTS supplier_followers (
  researcher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  via_code      text,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (researcher_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS supplier_followers_supplier_idx ON supplier_followers(supplier_id);

ALTER TABLE supplier_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_followers_self" ON supplier_followers;
CREATE POLICY "supplier_followers_self" ON supplier_followers
  FOR ALL USING (auth.uid() = researcher_id OR auth.uid() = supplier_id);

-- =====================
-- 4. 인증 연구자 초대 수 카운트 RPC
--    - referrals.invitee_id IS NOT NULL (가입 완료)
--    - invitee_role='researcher'
--    - 인증된 연구자만 (researcher_profiles 행 존재 + phone 비어있지 않음)
-- =====================
CREATE OR REPLACE FUNCTION count_verified_researcher_referrals(p_supplier_id uuid)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT COUNT(DISTINCT r.invitee_id)::int
  FROM referrals r
  JOIN researcher_profiles rp ON rp.user_id = r.invitee_id
  WHERE r.inviter_id = p_supplier_id
    AND r.invitee_role = 'researcher'
    AND r.invitee_id IS NOT NULL
    AND COALESCE(NULLIF(rp.phone, ''), NULL) IS NOT NULL;
$$;

-- =====================
-- 5. 코드 발급 자격 검증 + 발급 RPC (트랜잭션 안전)
-- =====================
CREATE OR REPLACE FUNCTION issue_supplier_referral_code(p_supplier_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count      int;
  v_existing   text;
  v_code       text;
  v_attempts   int := 0;
  v_chars      text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 0/O/I/1 제외
BEGIN
  -- 이미 발급된 경우 그대로 반환
  SELECT referral_code INTO v_existing FROM supplier_profiles WHERE user_id = p_supplier_id;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('ok', true, 'already_issued', true, 'code', v_existing);
  END IF;

  -- 자격 검증: 인증 연구자 10명+ 초대
  v_count := count_verified_researcher_referrals(p_supplier_id);
  IF v_count < 10 THEN
    RETURN json_build_object('ok', false, 'reason', 'threshold_not_met', 'count', v_count, 'required', 10);
  END IF;

  -- 코드 생성 (충돌 시 재시도)
  LOOP
    v_attempts := v_attempts + 1;
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;

    BEGIN
      UPDATE supplier_profiles
        SET referral_code = v_code,
            referral_code_issued_at = now(),
            referral_code_active = true
      WHERE user_id = p_supplier_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts > 8 THEN
        RETURN json_build_object('ok', false, 'reason', 'code_collision');
      END IF;
    END;
  END LOOP;

  RETURN json_build_object('ok', true, 'code', v_code, 'count', v_count);
END;
$$;
