/**
 * 빠른 조언 라우트 (/quick-advice)
 *
 * 버블 탭 또는 클립보드 자동 인식으로 진입.
 * store.currentAnalysisText 가 있으면 그걸로, 없으면 클립보드에서 읽음.
 */

import { useRouter } from 'expo-router';
import QuickAdviceScreenComponent from '../screens/QuickAdviceScreen';

export default function QuickAdviceRoute() {
  return <QuickAdviceScreenComponent />;
}
