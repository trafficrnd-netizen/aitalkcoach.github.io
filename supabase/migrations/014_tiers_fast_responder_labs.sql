-- 공급자 티어 + 빠른 응답 인증 + 랩 그룹
-- M14: 사용자 증가 가속 — 3가지 강화 아이디어

-- =====================
-- 1. 공급자 티어 (Bronze/Silver/Gold)
-- =====================
ALTER TABLE supplier_profiles
  ADD COLUMN IF NOT EXISTS referral_tier text;

-- 카운트 → 티어
CREATE OR REPLACE FUNCTION compute_supplier_tier(p_count int) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_count >= 100 THEN 'gold'
    WHEN p_count >= 30  THEN 'silver'
    WHEN p_count >= 10  THEN 'bronze'
    ELSE NULL
  END;
$$;

-- 발급 시점에 티어 자동 설정하도록 RPC 보강
CREATE OR REPLACE FUNCTION issue_supplier_referral_code(p_supplier_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count    int;
  v_existing text;
  v_code     text;
  v_attempts int := 0;
  v_chars    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_tier     text;
BEGIN
  v_count := count_verified_researcher_referrals(p_supplier_id);
  v_tier  := compute_supplier_tier(v_count);

  SELECT referral_code INTO v_existing FROM supplier_profiles WHERE user_id = p_supplier_id;
  IF v_existing IS NOT NULL THEN
    -- 기존 코드 보유자: 티어만 최신화하여 반환
    UPDATE supplier_profiles SET referral_tier = v_tier WHERE user_id = p_supplier_id;
    RETURN json_build_object('ok', true, 'already_issued', true, 'code', v_existing, 'tier', v_tier, 'count', v_count);
  END IF;

  IF v_count < 10 THEN
    RETURN json_build_object('ok', false, 'reason', 'threshold_not_met', 'count', v_count, 'required', 10);
  END IF;

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
            referral_code_active = true,
            referral_tier = v_tier
      WHERE user_id = p_supplier_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts > 8 THEN
        RETURN json_build_object('ok', false, 'reason', 'code_collision');
      END IF;
    END;
  END LOOP;

  RETURN json_build_object('ok', true, 'code', v_code, 'tier', v_tier, 'count', v_count);
END;
$$;

-- 티어 재계산용 함수 (관리자 또는 cron 호출)
CREATE OR REPLACE FUNCTION refresh_supplier_tier(p_supplier_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_tier text;
BEGIN
  v_tier := compute_supplier_tier(count_verified_researcher_referrals(p_supplier_id));
  UPDATE supplier_profiles SET referral_tier = v_tier WHERE user_id = p_supplier_id;
  RETURN v_tier;
END;
$$;

-- =====================
-- 2. 빠른 응답 인증 (fast responder)
--    조건: 최근 30일 입찰 중 응답시간 평균 ≤ 60분 + 입찰 5건 이상
-- =====================
CREATE OR REPLACE FUNCTION is_fast_responder(p_supplier_id uuid, p_days int DEFAULT 30)
RETURNS boolean LANGUAGE sql STABLE AS $$
  WITH recent AS (
    SELECT EXTRACT(EPOCH FROM (b.created_at - r.created_at)) / 60 AS minutes
    FROM bids b
    JOIN requests r ON r.id = b.request_id
    WHERE b.supplier_id = p_supplier_id
      AND b.created_at > now() - make_interval(days => p_days)
  )
  SELECT COUNT(*) >= 5 AND AVG(minutes) <= 60
  FROM recent;
$$;

-- 평균/카운트 노출용 (대시보드 표시)
CREATE OR REPLACE FUNCTION supplier_response_stats(p_supplier_id uuid, p_days int DEFAULT 30)
RETURNS json LANGUAGE sql STABLE AS $$
  WITH recent AS (
    SELECT EXTRACT(EPOCH FROM (b.created_at - r.created_at)) / 60 AS minutes
    FROM bids b
    JOIN requests r ON r.id = b.request_id
    WHERE b.supplier_id = p_supplier_id
      AND b.created_at > now() - make_interval(days => p_days)
  )
  SELECT json_build_object(
    'days', p_days,
    'bids', COUNT(*),
    'avg_minutes', COALESCE(ROUND(AVG(minutes))::int, 0),
    'fast_responder', COUNT(*) >= 5 AND AVG(minutes) <= 60
  ) FROM recent;
$$;

-- =====================
-- 3. 랩 그룹 (lab group)
--    같은 institution+department 의 인증 연구자 5명 이상이면 그룹 형성 가능
-- =====================
CREATE TABLE IF NOT EXISTS lab_groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution   text NOT NULL,
  department    text,
  name          text NOT NULL,
  leader_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code          text UNIQUE,
  member_count  int  NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (institution, COALESCE(department, ''))
);

CREATE INDEX IF NOT EXISTS lab_groups_code_idx ON lab_groups(code) WHERE code IS NOT NULL;

ALTER TABLE researcher_profiles
  ADD COLUMN IF NOT EXISTS lab_group_id uuid REFERENCES lab_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS researcher_profiles_lab_idx ON researcher_profiles(lab_group_id);

ALTER TABLE lab_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_groups_read_all" ON lab_groups;
CREATE POLICY "lab_groups_read_all" ON lab_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "lab_groups_write_service" ON lab_groups;
CREATE POLICY "lab_groups_write_service" ON lab_groups
  FOR ALL USING (auth.role() = 'service_role');

-- 같은 기관+학과의 인증 연구자 카운트 (본인 기준)
CREATE OR REPLACE FUNCTION count_lab_peers(p_user_id uuid)
RETURNS json LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_inst text; v_dept text; v_count int;
BEGIN
  SELECT institution, department INTO v_inst, v_dept
  FROM researcher_profiles WHERE user_id = p_user_id;
  IF v_inst IS NULL THEN
    RETURN json_build_object('institution', NULL, 'department', NULL, 'count', 0);
  END IF;
  SELECT COUNT(*) INTO v_count
  FROM researcher_profiles
  WHERE institution = v_inst
    AND COALESCE(department,'') = COALESCE(v_dept,'')
    AND COALESCE(NULLIF(phone,''),NULL) IS NOT NULL;
  RETURN json_build_object('institution', v_inst, 'department', v_dept, 'count', v_count);
END;
$$;

-- 랩 그룹 생성/가입 RPC
--   - 같은 institution+department 의 인증 연구자 5명 이상이면 그룹 형성
--   - 본인이 leader 가 되고 동일 기관 연구자들이 자동 가입(미가입자만)
--   - 그룹 코드(8자) 자동 발급
CREATE OR REPLACE FUNCTION claim_lab_group(p_leader_id uuid, p_name text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inst text; v_dept text; v_count int;
  v_lab  uuid;
  v_code text;
  v_attempts int := 0;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  SELECT institution, department INTO v_inst, v_dept
  FROM researcher_profiles WHERE user_id = p_leader_id;
  IF v_inst IS NULL THEN
    RETURN json_build_object('ok', false, 'reason', 'no_institution');
  END IF;
  SELECT COUNT(*) INTO v_count
  FROM researcher_profiles
  WHERE institution = v_inst
    AND COALESCE(department,'') = COALESCE(v_dept,'')
    AND COALESCE(NULLIF(phone,''),NULL) IS NOT NULL;
  IF v_count < 5 THEN
    RETURN json_build_object('ok', false, 'reason', 'threshold_not_met', 'count', v_count, 'required', 5);
  END IF;

  -- 이미 존재하는 그룹이면 참여
  SELECT id, code INTO v_lab, v_code
  FROM lab_groups
  WHERE institution = v_inst AND COALESCE(department,'') = COALESCE(v_dept,'')
  LIMIT 1;

  IF v_lab IS NULL THEN
    -- 코드 생성
    LOOP
      v_attempts := v_attempts + 1;
      v_code := '';
      FOR i IN 1..8 LOOP
        v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
      END LOOP;
      BEGIN
        INSERT INTO lab_groups (institution, department, name, leader_id, code, member_count)
        VALUES (v_inst, v_dept, COALESCE(NULLIF(p_name,''), v_inst || COALESCE(' / '||v_dept,'')), p_leader_id, v_code, v_count)
        RETURNING id INTO v_lab;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        IF v_attempts > 8 THEN
          RETURN json_build_object('ok', false, 'reason', 'code_collision');
        END IF;
      END;
    END LOOP;
  END IF;

  -- 동일 기관·학과 인증 연구자 자동 연결
  UPDATE researcher_profiles
    SET lab_group_id = v_lab
    WHERE institution = v_inst
      AND COALESCE(department,'') = COALESCE(v_dept,'')
      AND COALESCE(NULLIF(phone,''),NULL) IS NOT NULL
      AND lab_group_id IS NULL;

  -- 멤버 카운트 재계산
  UPDATE lab_groups SET member_count = (
    SELECT COUNT(*) FROM researcher_profiles WHERE lab_group_id = v_lab
  ) WHERE id = v_lab;

  RETURN json_build_object('ok', true, 'lab_id', v_lab, 'code', v_code, 'count', v_count, 'institution', v_inst, 'department', v_dept);
END;
$$;
