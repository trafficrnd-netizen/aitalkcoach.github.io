/**
 * 분석 결과 스크린 (/analysis)
 */

import { useRouter } from 'expo-router';
import AnalysisScreenComponent from '../screens/AnalysisScreen';

export default function AnalysisScreen() {
  const router = useRouter();

  const handleNavigate = (screen, params) => {
    router.push({ pathname: `/${screen}`, params: params || {} });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <AnalysisScreenComponent
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  );
}
