/**
 * 홈 스크린 (/ 경로)
 *
 * 메인 화면 - 파일 업로드 및 분석 시작
 */

import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import HomeScreenComponent from '../screens/HomeScreen';

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigate = (screen, params) => {
    router.push({ pathname: `/${screen}`, params: params || {} });
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <HomeScreenComponent
      onNavigate={handleNavigate}
      onSettings={handleSettings}
    />
  );
}
