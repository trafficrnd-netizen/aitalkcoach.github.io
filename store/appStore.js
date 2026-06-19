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
      chatHistory: [],

      setCurrentChat: (chat) => set({ currentChat: chat }),

      addToHistory: (chat) =>
        set((state) => ({
          chatHistory: [chat, ...state.chatHistory].slice(0, 50), // 최대 50개
        })),

      clearHistory: () => set({ chatHistory: [], currentChat: null }),

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
