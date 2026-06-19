/**
 * React Native 앱 - 메인 진입점
 *
  * AI톡 코치 - 카카오톡 대화 분석 앱
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 스크린
import HomeScreen from './screens/HomeScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import SettingsScreen from './screens/SettingsScreen';
import HowToScreen from './screens/HowToScreen';

// 서비스
import { loadSubscription } from './services/revenuecat';

// Zustand 상태 관리
import { useAppStore } from './store/appStore';

// ===== 테마 설정 =====
const customTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366F1', // Indigo
    secondary: '#EC4899', // Pink
    tertiary: '#10B981', // Emerald
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

// ===== 화면 전환 스택 =====
function App() {
  const [screenStack, setScreenStack] = useState(['home']);
  const [navParams, setNavParams] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const { isDarkMode, setSubscription, user } = useAppStore();

  // 구독 상태 확인
  useEffect(() => {
    const initApp = async () => {
      try {
        const subscription = await loadSubscription();
        setSubscription(subscription);
        setIsLoading(false);
      } catch (error) {
        console.error('앱 초기화 실패:', error);
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // ===== 네비게이션 =====
  const navigateTo = (screen, params = {}) => {
    setNavParams(params || {});
    setScreenStack((prev) => [...prev, screen]);
  };

  const goBack = () => {
    setScreenStack((prev) => {
      if (prev.length <= 1) return ['home'];
      return prev.slice(0, -1);
    });
  };

  const goHome = () => {
    setScreenStack(['home']);
    setNavParams({});
  };

  const currentScreen = screenStack[screenStack.length - 1];

  // ===== 스크린 렌더링 =====
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={navigateTo}
            onSettings={() => navigateTo('settings')}
          />
        );

      case 'analysis':
        return (
          <AnalysisScreen
            route={{ params: navParams }}
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );

      case 'subscription':
        return (
          <SubscriptionScreen
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );

      case 'howto':
        return (
          <HowToScreen
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );

      default:
        return (
          <HomeScreen
            onNavigate={navigateTo}
            onSettings={() => navigateTo('settings')}
          />
        );
    }
  };

  // ===== 로딩 화면 =====
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={customTheme}>
          <SafeAreaView style={styles.loadingContainer}>
            <Text style={styles.loadingIcon}>💬</Text>
            <Text style={styles.loadingText}>AI톡 코치</Text>
            <Text style={styles.loadingSubtext}>AI가 대화를 분석하고 있어요...</Text>
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // ===== 메인 렌더링 =====
  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDarkMode ? darkTheme : customTheme}>
        <SafeAreaView
          style={[
            styles.container,
            isDarkMode && styles.containerDark,
          ]}
        >
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
          />
          {renderScreen()}
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// ===== 스타일 =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default App;
