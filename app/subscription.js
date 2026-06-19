/**
 * 구독 스크린 (/subscription)
 */

import { useRouter } from 'expo-router';
import SubscriptionScreenComponent from '../screens/SubscriptionScreen';

export default function SubscriptionScreen() {
  const router = useRouter();

  const handleNavigate = (screen, params) => {
    router.push({ pathname: `/${screen}`, params: params || {} });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SubscriptionScreenComponent
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  );
}
