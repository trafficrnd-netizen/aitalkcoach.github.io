/**
 * Expo Router Root Layout
 *
 * 모든 화면의 기본 레이아웃 + 플로팅 버블
 */

import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { loadSubscription } from '../services/revenuecat';
import { useAppStore } from '../store/appStore';
import { FloatingBubble } from '../components/FloatingBubble';

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
  const systemColorScheme = useColorScheme();
  const { isDarkMode, setSubscription } = useAppStore();
  const isDark = isDarkMode || systemColorScheme === 'dark';
  const theme = isDark ? darkTheme : customTheme;

  // ===== 구독 상태 로드 =====
  useEffect(() => {
    const initApp = async () => {
      try {
        const subscription = await loadSubscription();
        setSubscription(subscription);
      } catch (error) {
        console.error('구독 상태 로드 실패:', error);
      }
    };
    initApp();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="howto" />
        <Stack.Screen
          name="floating-analysis"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack>

      {/* 플로팅 버블 - 네비게이션 위에 오버레이 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <FloatingBubble />
      </View>
    </PaperProvider>
  );
}
