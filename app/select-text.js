/**
 * 텍스트 선택 스크린 라우트 (/select-text)
 *
 * 자동 유입(카톡 알림/접근성/클립보드) 텍스트를 분석하기 전에
 * 사용자가 메시지 단위로 선택할 수 있는 단계.
 *
 * NOTE: 긴 텍스트와 선택 상태는 store/currentAnalysisText 에 보관됨.
 *       route params 로는 식별자도 안 넘김 (단독 화면).
 */

import SelectTextScreenComponent from '../screens/SelectTextScreen';

export default function SelectTextRoute() {
  // SelectTextScreen은 내부적으로 router 를 직접 사용하므로
  // 라우트 컴포넌트는 단순히 화면만 렌더링한다.
  return <SelectTextScreenComponent />;
}
