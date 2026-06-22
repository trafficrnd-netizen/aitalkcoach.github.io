/**
 * 홈 스크린 (/ 경로)
 *
 * 메인 화면 - 파일 업로드 및 분석 시작
 *
 * NOTE: 분석 텍스트(긴 string)는 store에 저장됨. route params로는 짧은 식별자만 전달.
 */

import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import HomeScreenComponent from '../screens/HomeScreen';

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigate = (screen, params) => {
    // Expo Router params는 string/number/boolean만 안정적으로 직렬화됨.
    // object (chatData)는 RN 0.85 새 아키텍처 interop 이슈로 빈 값이 될 수 있음.
    // 긴 string (분석 텍스트)도 새 arch에서 잘리거나 비어질 수 있어 store에 보관.
    // 따라서 짧은 식별자(string)만 안전하게 추출해서 전달.
    const safeParams = {};
    if (params) {
      if (typeof params.chatId === 'string') safeParams.chatId = params.chatId;
      if (typeof params.chatName === 'string') safeParams.chatName = params.chatName;
      if (typeof params.isRecent !== 'undefined') safeParams.isRecent = String(params.isRecent);
    }
    router.push({ pathname: `/${screen}`, params: safeParams });
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
