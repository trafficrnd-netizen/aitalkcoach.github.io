/**
 * 분석 결과 스크린 (/analysis)
 *
 * 분석 텍스트는 zustand store에 저장되어 있음 (긴 string이라 route params로 못 넘김).
 * route params는 chatId/chatName 같은 식별자만 받음.
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import AnalysisScreenComponent from '../screens/AnalysisScreen';

export default function AnalysisScreenRoute() {
  const router = useRouter();
  const routeParams = useLocalSearchParams();

  const handleNavigate = (screen, params) => {
    router.push({ pathname: `/${screen}`, params: params || {} });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <AnalysisScreenComponent
      route={{ params: routeParams }}
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  );
}
