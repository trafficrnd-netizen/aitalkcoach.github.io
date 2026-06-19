/**
 * 사용법 스크린 (/howto)
 */

import { useRouter } from 'expo-router';
import HowToScreenComponent from '../screens/HowToScreen';

export default function HowToScreen() {
  const router = useRouter();

  const handleNavigate = (screen, params) => {
    router.push({ pathname: `/${screen}`, params: params || {} });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <HowToScreenComponent
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  );
}
