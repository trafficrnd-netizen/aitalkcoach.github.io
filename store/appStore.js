/**
 * Zustand 상태 관리 스토어
 *
 * 앱 전체 상태 관리
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 앱 상태 스토어
 */
const useAppStore = create(
  persist(
    (set, get) => ({
      // ===== 인증 상태 =====
      // - provider: 'guest' | 'google' | 'kakao' | 'test'
      // - isLoggedIn: user.id가 있으면 true
      user: {
        id: null,
        email: null,
        name: null,
        provider: 'guest',
        avatar: null,
        isDarkMode: false,
        isFirstLaunch: true,
      },
      isLoggedIn: false,
      loginAt: null,

      login: (userData) =>
        set((state) => ({
          user: {
            ...state.user,
            id: userData.id,
            email: userData.email || null,
            name: userData.name || userData.email || '사용자',
            provider: userData.provider || 'test',
            avatar: userData.avatar || null,
          },
          isLoggedIn: true,
          loginAt: Date.now(),
        })),

      logout: () =>
        set((state) => ({
          user: {
            id: null,
            email: null,
            name: null,
            provider: 'guest',
            avatar: null,
            isDarkMode: state.user.isDarkMode,
            isFirstLaunch: state.user.isFirstLaunch,
          },
          isLoggedIn: false,
          loginAt: null,
          // 로그아웃 시 구독도 free로 (테스트 계정의 premium 효과 제거)
          subscription: {
            isPremium: false,
            tier: 'free',
            expiresAt: null,
            dailyUses: state.subscription.dailyUses,
            lastUsedDate: state.subscription.lastUsedDate,
          },
        })),

      // ===== 구독 상태 =====
      subscription: {
        isPremium: false,
        tier: 'free', // 'free' | 'monthly' | 'yearly'
        expiresAt: null,
        dailyUses: 0,
        lastUsedDate: null,
      },

      setSubscription: (subscription) =>
        set({ subscription }),

      // ===== 일일 사용량 관리 =====
      incrementUsage: () => {
        const { subscription } = get();
        const today = new Date().toDateString();

        // 날짜가 바뀌었으면 초기화
        if (subscription.lastUsedDate !== today) {
          set({
            subscription: {
              ...subscription,
              dailyUses: 1,
              lastUsedDate: today,
            },
          });
        } else {
          set({
            subscription: {
              ...subscription,
              dailyUses: subscription.dailyUses + 1,
            },
          });
        }
      },

      canUse: () => {
        const { subscription } = get();
        const FREE_DAILY_LIMIT = 3;

        if (subscription.isPremium) {
          return { allowed: true, reason: 'premium' };
        }

        if (subscription.dailyUses >= FREE_DAILY_LIMIT) {
          return {
            allowed: false,
            reason: 'limit_reached',
            message: `오늘 ${FREE_DAILY_LIMIT}회 사용하셨습니다. 내일 다시 이용해주세요.`,
          };
        }

        return { allowed: true, reason: 'free', remaining: FREE_DAILY_LIMIT - subscription.dailyUses };
      },

      // ===== 분석 결과 =====
      analysisResult: null,
      setAnalysisResult: (result) => set({ analysisResult: result }),
      clearAnalysisResult: () => set({ analysisResult: null }),

      // ===== 사용자 설정 =====
      user: {
        name: '',
        isDarkMode: false,
        isFirstLaunch: true,
      },

      setUser: (user) =>
        set((state) => ({
          user: { ...state.user, ...user },
        })),

      toggleDarkMode: () =>
        set((state) => ({
          user: { ...state.user, isDarkMode: !state.user.isDarkMode },
        })),

      setFirstLaunchComplete: () =>
        set((state) => ({
          user: { ...state.user, isFirstLaunch: false },
        })),

      // ===== 대화 데이터 =====
      currentChat: null,
      // 현재 분석 대상 텍스트 (긴 string이라 URL params에 넣지 않고 store에 보관)
      currentAnalysisText: null,
      // 분석 화면 진입 source: 'file' | 'clipboard' | 'kakao-chat' | 'kakao-copy' | 'recent' | 'quick'
      currentAnalysisSource: null,
      // 현재 분석의 채팅방 이름/발신자 (자동 분석 시 native에서 추출)
      currentAnalysisSender: null,
      // 분석 모드: 'emotion' (감정분석) | 'work' (업무분석) | 'quick' (빠른 조언)
      currentAnalysisMode: 'emotion',
      chatHistory: [],

      setCurrentChat: (chat) => set({ currentChat: chat }),

      // 분석 텍스트 + source + sender 함께 세팅 (route params보다 안정적)
      setCurrentAnalysis: (text, source = 'file', sender = null, mode = null) =>
        set((state) => ({
          currentAnalysisText: text,
          currentAnalysisSource: source,
          currentAnalysisSender: sender,
          // mode 명시 전달이 없으면 기존 모드 유지 (단, source가 바뀌면 emotion으로 reset)
          currentAnalysisMode:
            mode ||
            (source !== state.currentAnalysisSource ? 'emotion' : state.currentAnalysisMode),
        })),

      // 분석 모드만 변경 (UI 토글에서 호출)
      setAnalysisMode: (mode) => set({ currentAnalysisMode: mode }),

      clearCurrentAnalysis: () =>
        set({
          currentAnalysisText: null,
          currentAnalysisSource: null,
          currentAnalysisSender: null,
          currentAnalysisMode: 'emotion',
          currentChat: null,
        }),

      addToHistory: (chat) =>
        set((state) => ({
          chatHistory: [chat, ...state.chatHistory].slice(0, 50), // 최대 50개
        })),

      clearHistory: () =>
        set({ chatHistory: [], currentChat: null, currentAnalysisText: null, currentAnalysisSource: null }),

      // ===== UI 상태 =====
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),

      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // ===== 캐시 =====
      cacheSize: 0,
      setCacheSize: (size) => set({ cacheSize: size }),
      clearCache: () => set({ cacheSize: 0 }),

      // ===== 앱 정보 =====
      version: '1.0.0',
      dailyLimit: 3,

      // ===== 초기화 =====
      reset: () =>
        set({
          subscription: {
            isPremium: false,
            tier: 'free',
            expiresAt: null,
            dailyUses: 0,
            lastUsedDate: null,
          },
          analysisResult: null,
          currentChat: null,
          currentAnalysisText: null,
          currentAnalysisSource: null,
          chatHistory: [],
        }),
    }),
    {
      name: 'kakao-coach-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        user: state.user,
        chatHistory: state.chatHistory,
      }),
    }
  )
);

export { useAppStore };
