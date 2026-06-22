/**
 * 로그인 화면 (/login)
 *
 * 디자인:
 *  - 로고 + 안내 문구
 *  - "Google로 로그인" 버튼 (mock)
 *  - "카카오로 로그인" 버튼 (mock)
 *  - "테스트 계정으로 로그인" 토글 (id/pw 입력 필드)
 *
 * 실제 OAuth 연동 시 loginWithGoogle/loginWithKakao만 교체하면 됨.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import {
  applyPostLoginEffects,
  getTestAccountHints,
  loginWithCredentials,
  loginWithGoogle,
  loginWithKakao,
} from '../services/auth';
import {
  getAccountDevices,
  getOrCreateDeviceId,
  registerDeviceForAccount,
  getDeviceName,
  getDevicePlatform,
} from '../services/device';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const currentSub = useAppStore((s) => s.subscription);

  const [showTestForm, setShowTestForm] = useState(false);
  const [testId, setTestId] = useState('');
  const [testPw, setTestPw] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 로그인 후 기기 매칭 확인.
   * 다른 기기가 등록되어 있으면 교체할지 확인 → 교체 또는 취소.
   * 등록 가능한 슬롯이 비어있거나, 현재 기기 ID와 일치하면 자동 진행.
   */
  const handlePostLoginDeviceCheck = async (profile) => {
    const accountId = profile.id;
    const deviceCheck = await getAccountDevices(accountId);
    const currentId = await getOrCreateDeviceId();
    const myPlatform = getDevicePlatform();
    const mySlot = myPlatform === 'pc' ? 'pc' : 'mobile';

    // 이미 이 기기가 등록되어 있으면 OK
    if (deviceCheck.currentIsMobile || deviceCheck.currentIsPc) {
      return { ok: true, action: 'already-registered' };
    }

    // 슬롯이 비어있으면 자동 등록
    const slotDevice = mySlot === 'mobile' ? deviceCheck.mobile : deviceCheck.pc;
    if (!slotDevice) {
      await registerDeviceForAccount(accountId);
      return { ok: true, action: 'registered' };
    }

    // 다른 기기가 등록되어 있음 → 교체 확인
    return new Promise((resolve) => {
      Alert.alert(
        '다른 기기에서 사용 중',
        `이 계정은 "${slotDevice.name || '다른 기기'}"에서 사용 중이에요.\n\n이 기기(${getDeviceName()})로 교체하면 이전 기기는 로그아웃됩니다.`,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => resolve({ ok: false, action: 'cancelled' }),
          },
          {
            text: '교체하기',
            style: 'destructive',
            onPress: async () => {
              await registerDeviceForAccount(accountId);
              resolve({ ok: true, action: 'replaced', previousDevice: slotDevice });
            },
          },
        ],
      );
    });
  };

  const handleProviderLogin = async (provider) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = provider === 'google' ? await loginWithGoogle() : await loginWithKakao();
      if (result.success) {
        const check = await handlePostLoginDeviceCheck(result.profile);
        if (!check.ok) {
          setError('다른 기기에서 사용 중이라 로그인이 취소됐어요.');
          return;
        }
        login(result.profile);
        router.replace('/');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (e) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginWithCredentials(testId, testPw);
      if (result.success) {
        const check = await handlePostLoginDeviceCheck(result.profile);
        if (!check.ok) {
          setError('다른 기기에서 사용 중이라 로그인이 취소됐어요.');
          return;
        }
        login(result.profile);
        setSubscription(applyPostLoginEffects(result.profile, currentSub));
        router.replace('/');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (e) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const hints = getTestAccountHints();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* 로고 */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>💬</Text>
            <Text style={styles.logoTitle}>AI톡 코치</Text>
            <Text style={styles.logoSubtitle}>
              카카오톡 대화를 분석하고{'\n'}더 나은 관계를 만들어보세요
            </Text>
          </View>

          {/* 에러 */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          )}

          {/* 소셜 로그인 버튼들 */}
          <View style={styles.socialGroup}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => handleProviderLogin('google')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>🇬</Text>
              <Text style={styles.socialText}>Google로 로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.kakaoButton]}
              onPress={() => handleProviderLogin('kakao')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={[styles.socialIcon, styles.kakaoIcon]}>💬</Text>
              <Text style={[styles.socialText, styles.kakaoText]}>카카오로 로그인</Text>
            </TouchableOpacity>
          </View>

          {/* 또는 */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 테스트 계정 로그인 */}
          {!showTestForm ? (
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => setShowTestForm(true)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.testButtonIcon}>🔑</Text>
              <Text style={styles.testButtonText}>테스트 계정으로 로그인</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.testForm}>
              <Text style={styles.testFormTitle}>🔑 테스트 계정 로그인</Text>
              <Text style={styles.testFormDesc}>
                모든 기능 (프리미엄 포함) 즉시 이용 가능
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>아이디</Text>
                <TextInput
                  style={styles.input}
                  value={testId}
                  onChangeText={setTestId}
                  placeholder="test"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={testPw}
                  onChangeText={setTestPw}
                  placeholder="test1234"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleTestLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>로그인</Text>
                )}
              </TouchableOpacity>

              {/* 힌트 토글 */}
              <TouchableOpacity
                style={styles.hintToggle}
                onPress={() => setShowHints((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.hintToggleText}>
                  {showHints ? '▼ 테스트 계정 목록 숨기기' : '▶ 테스트 계정 목록 보기'}
                </Text>
              </TouchableOpacity>

              {showHints && (
                <View style={styles.hintBox}>
                  {hints.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      style={styles.hintRow}
                      onPress={() => {
                        setTestId(h.id);
                        setTestPw(h.pw);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.hintId}>{h.id}</Text>
                      <Text style={styles.hintSep}> / </Text>
                      <Text style={styles.hintPw}>{h.pw}</Text>
                      <Text style={styles.hintTap}>탭하여 입력</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowTestForm(false);
                  setError(null);
                  setTestId('');
                  setTestPw('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>닫기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 안내 */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              🔒 로그인 후에도 모든 분석은 기기 내에서만 처리되며,{'\n'}
              대화 데이터는 외부로 전송되지 않습니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  kav: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  socialGroup: {
    marginBottom: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '600',
  },
  kakaoIcon: {
    color: '#3C1E1E',
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  kakaoText: {
    color: '#3C1E1E',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 13,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  testButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  testForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testFormTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  testFormDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  hintToggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  hintToggleText: {
    color: '#6B7280',
    fontSize: 12,
  },
  hintBox: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  hintId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hintSep: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  hintPw: {
    fontSize: 13,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hintTap: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  cancelButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  noticeBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  noticeText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
