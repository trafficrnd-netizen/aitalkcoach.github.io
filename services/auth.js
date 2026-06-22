/**
 * 인증 서비스
 *
 * 실제 OAuth (Google/Kakao) 대신 mock 인증을 사용합니다.
 *  - 테스트 계정: 하드코딩된 id/pw 매칭
 *  - Google/Kakao 로그인: 실제 OAuth flow는 추후 연동, 현재는 mock으로 provider만 다르게 로그인
 *
 * 추후 실제 OAuth 연동 시 이 파일의 loginWithGoogle/loginWithKakao만 교체하면 됨.
 */

const TEST_ACCOUNTS = [
  {
    id: 'test',
    pw: 'test1234',
    profile: {
      id: 'test-001',
      email: 'test@aitalkcoach.app',
      name: '테스트 유저',
      provider: 'test',
    },
  },
  {
    id: 'admin',
    pw: 'admin1234',
    profile: {
      id: 'admin-001',
      email: 'admin@aitalkcoach.app',
      name: '관리자',
      provider: 'test',
    },
  },
  {
    id: 'demo',
    pw: 'demo',
    profile: {
      id: 'demo-001',
      email: 'demo@aitalkcoach.app',
      name: 'Demo',
      provider: 'test',
    },
  },
];

/**
 * id/pw 매칭으로 테스트 계정 로그인
 * @returns {Promise<{success: boolean, profile?: object, error?: string}>}
 */
export async function loginWithCredentials(loginId, password) {
  // 네트워크 호출 시뮬레이션 (실제론 0ms지만 UX 위해 살짝)
  await new Promise((r) => setTimeout(r, 250));

  if (!loginId || !password) {
    return { success: false, error: '아이디와 비밀번호를 입력해주세요.' };
  }

  const found = TEST_ACCOUNTS.find(
    (a) => a.id.toLowerCase() === String(loginId).toLowerCase() && a.pw === password,
  );

  if (!found) {
    return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }

  return { success: true, profile: found.profile };
}

/**
 * Google 로그인 (mock) — 실제 OAuth 연동 전까지 provider만 표시
 * 추후 @react-native-google-signin/google-signin 으로 교체
 */
export async function loginWithGoogle() {
  await new Promise((r) => setTimeout(r, 500));
  return {
    success: true,
    profile: {
      id: `google-${Date.now()}`,
      email: 'user@gmail.com',
      name: 'Google 사용자',
      provider: 'google',
    },
  };
}

/**
 * 카카오 로그인 (mock) — 실제 OAuth 연동 전까지 provider만 표시
 * 추후 @react-native-kakao-share 또는 Kakao SDK 로 교체
 */
export async function loginWithKakao() {
  await new Promise((r) => setTimeout(r, 500));
  return {
    success: true,
    profile: {
      id: `kakao-${Date.now()}`,
      email: 'user@kakao.com',
      name: '카카오 사용자',
      provider: 'kakao',
    },
  };
}

/**
 * 로그인 후 자동으로 적용될 부가 효과 (테스트 계정용)
 * - premium 활성화
 * - 사용량 무제한
 */
export function applyPostLoginEffects(profile, currentSubscription) {
  if (profile.provider === 'test') {
    return {
      ...currentSubscription,
      isPremium: true,
      tier: 'test',
      dailyUses: 0,
      lastUsedDate: null,
      expiresAt: null, // 테스트 계정은 만료 없음
    };
  }
  // Google/Kakao mock 로그인 — 무료 사용자 그대로
  return currentSubscription;
}

/**
 * 개발/디버깅용: 사용 가능한 테스트 계정 목록
 * UI에서 "테스트 계정 보기" 토글로 노출
 */
export function getTestAccountHints() {
  return TEST_ACCOUNTS.map((a) => ({ id: a.id, pw: a.pw }));
}
