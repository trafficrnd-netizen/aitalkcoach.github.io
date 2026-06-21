import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme, AppState, DeviceEventEmitter, NativeModules } from 'react-native';
import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { initRevenueCat, loadSubscription } from '../services/revenuecat';
import { useAppStore } from '../store/appStore';
import FloatingBubble from '../components/FloatingBubble';

const { KakaoNotif } = NativeModules;

// ===== 테마 설정 =====
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366F1',
    secondary: '#EC4899',
    tertiary: '#10B981',
    error: '#EF4444',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818CF8',
    secondary: '#F472B6',
    tertiary: '#34D399',
    error: '#F87171',
    background: '#111827',
    surface: '#1F2937',
    surfaceVariant: '#374151',
  },
};

export default function RootLayout() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const setCurrentAnalysis = useAppStore((s) => s.setCurrentAnalysis);
  // isDarkMode는 user 객체 안에 있음 (이전 코드에서 잘못된 path였음)
  const isDarkMode = useAppStore((s) => s.user?.isDarkMode);
  const setSubscription = useAppStore((s) => s.setSubscription);
  // light theme만 사용 (다크모드 가독성 문제로 사용자 환경에서는 light로 강제)
  // 추후 dark mode 재정비 후 다시 활성화
  const isDark = false;
  const theme = customTheme;

  // ===== 공통: 텍스트 받아서 선택 화면으로 =====
  // 자동 유입(카톡 알림/접근성/클립보드) 텍스트는 곧바로 /analysis 로 가지 않고
  // /select-text 에서 사용자가 어떤 메시지를 분석할지 고를 수 있게 한다.
  // (file upload 플로우는 HomeScreen.handleStartAnalysis 에서 직접 /analysis 로
  //  라우팅하므로 본 함수의 영향을 받지 않음.)
  const lastAutoAnalyzeRef = useRef(0);
  const handleIncomingText = (text, source = 'kakao-notif', sender = null) => {
    if (!text || text.trim().length < 5) return;
    // 3초 cooldown (같은 텍스트가 짧은 시간에 여러 번 들어와도 1회만)
    if (Date.now() - lastAutoAnalyzeRef.current < 3000) return;
    lastAutoAnalyzeRef.current = Date.now();

    // [FAIL-FAST] store에 저장 먼저 → select-text 화면이 안전하게 읽을 수 있게
    setCurrentAnalysis(text, source, sender);

    // 선택 화면으로 이동. select-text 가 사용자 선택을 끝낸 뒤 store 텍스트를
    // 갈아끼우고 /analysis 로 replace 한다.
    router.push('/select-text');
  };

  // ===== 클립보드 자동 분석 트리거 =====
  // 사용자가 우리 앱을 열면(또는 background→foreground) 클립보드 텍스트가 있는지 확인
  // → 있으면 분석 화면으로 자동 navigate (store 에 텍스트 저장)
  useEffect(() => {
    const checkClipboard = async () => {
      if (Date.now() - lastAutoAnalyzeRef.current < 10000) return;
      try {
        const hasString = await Clipboard.hasStringAsync();
        if (!hasString) return;
        const text = await Clipboard.getStringAsync();
        if (!text || text.trim().length < 20) return;
        handleIncomingText(text, 'clipboard');
      } catch {
        // silent
      }
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkClipboard();
    });
    checkClipboard();

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const initApp = async () => {
      await initRevenueCat();
      const subscription = await loadSubscription();
      setSubscription(subscription);
    };
    initApp();
  }, []);

  // ===== 카톡 알림 / 접근성 / 클립보드 자동 분석 =====
  // 1) KakaoIncomingText (MainActivity가 intent extra를 JS로 emit)
  // 2) KakaoNotificationReceived (구 arch interop fallback)
  // 3) in-memory static 변수를 RN bridge polling (가장 안정적 fallback)
  useEffect(() => {
    // (1) KakaoIncomingText — MainActivity intent handler 가 emit
    const sub1 = DeviceEventEmitter.addListener('KakaoIncomingText', (data) => {
      handleIncomingText(data?.text, data?.source || 'kakao-notif', data?.sender || null);
    });

    // (2) KakaoNotificationReceived — 구 arch interop (혹시 모를 경로)
    const sub2 = DeviceEventEmitter.addListener('KakaoNotificationReceived', (data) => {
      handleIncomingText(data?.text, 'kakao-notif', data?.sender || null);
    });

    // (3) Polling — KakaoNotifListenerService/KakaoAccessibilityService in-memory store
    const poll = setInterval(async () => {
      if (!KakaoNotif?.checkLatest) return;
      try {
        const data = await KakaoNotif.checkLatest();
        if (data?.text) {
          // source 는 timestamp 기반으로 가장 최근 것을 추측하지 못하므로 기본값
          handleIncomingText(data.text, 'kakao-chat', data?.sender || null);
        }
      } catch {
        // silent
      }
    }, 2000);

    return () => {
      sub1.remove();
      sub2.remove();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="select-text" />
          <Stack.Screen name="analysis" />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="howto" />
          <Stack.Screen name="login" />
          <Stack.Screen
            name="floating-analysis"
            options={{ presentation: 'transparentModal', animation: 'fade' }}
          />
        </Stack>
        <FloatingBubble
          onAnalyze={() => console.log('[FloatingBubble] tapped - analyzing clipboard')}
        />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}