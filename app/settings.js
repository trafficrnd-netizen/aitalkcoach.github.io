/**
 * 설정 스크린 (/settings)
 */

import { useRouter } from 'expo-router';
import SettingsScreenComponent from '../screens/SettingsScreen';

export default function SettingsScreen() {
  const router = useRouter();

  const handleNavigate = (screen, params) => {
    router.push({ pathname: `/${screen}`, params: params || {} });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SettingsScreenComponent
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  );
}
