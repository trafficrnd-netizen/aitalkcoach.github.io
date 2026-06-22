/**
 * RevenueCat 구독 서비스
 *
 * 앱 내구독 관리
 */

import Purchases from 'react-native-purchases';
import { useAppStore } from '../store/appStore';

// RevenueCat API 키 (설정 필요)
// - .env에 EXPO_PUBLIC_REVENUECAT_API_KEY 가 있으면 사용, 없으면 빈 문자열 → SDK 미설정으로 동작
// - 의도적으로 placeholder('your_revenuecat_api_key')가 들어있어도 미설정으로 간주
const REVENUECAT_API_KEY =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_REVENUECAT_API_KEY) ||
  '';
const IS_REVENUECAT_CONFIGURED =
  REVENUECAT_API_KEY.length > 0 &&
  REVENUECAT_API_KEY !== 'your_revenuecat_api_key';

const FREE_TIER = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
};

// ===== 초기화 =====
export async function initRevenueCat() {
  if (!IS_REVENUECAT_CONFIGURED) {
    // SDK 미설정: 조용히 free tier로 동작 (구독 기능 비활성)
    return false;
  }
  try {
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    return true;
  } catch (error) {
    // 실제 초기화 실패는 조용히 false 리턴 (콘솔 spam 방지)
    return false;
  }
}

// ===== 구독 상태 로드 =====
export async function loadSubscription() {
  if (!IS_REVENUECAT_CONFIGURED) {
    // SDK 미설정 시 즉시 free tier 리턴 → Purchases.* 호출 자체를 안 해서 SDK 콘솔 경고도 안 뜸
    return FREE_TIER;
  }
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    // 프리미엄 상태 확인
    const isPremium = customerInfo.entitlements.active.premium !== undefined;
    const tier = isPremium
      ? customerInfo.entitlements.active.premium.expirationDate
        ? 'monthly'
        : 'yearly'
      : 'free';

    return {
      isPremium,
      tier,
      expiresAt: customerInfo.entitlements.active.premium?.expirationDate || null,
      raw: customerInfo,
    };
  } catch (error) {
    // 런타임 에러도 조용히 free tier로 폴백 (콘솔 spam 방지)
    return FREE_TIER;
  }
}

// ===== 구독 상품 조회 =====
export async function getSubscriptionProducts() {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      return null;
    }

    return {
      monthly: offerings.current.availablePackages.find(
        (p) => p.packageType === 'MONTHLY'
      ),
      yearly: offerings.current.availablePackages.find(
        (p) => p.packageType === 'ANNUAL'
      ),
      offering: offerings.current,
    };
  } catch (error) {
    console.error('구독 상품 조회 실패:', error);
    return null;
  }
}

// ===== 구독 구매 =====
export async function purchaseSubscription(packageToPurchase) {
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(
      packageToPurchase
    );

    const isPremium = customerInfo.entitlements.active.premium !== undefined;

    return {
      success: true,
      isPremium,
      customerInfo,
    };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('구독 구매 실패:', error);
    return { success: false, error: error.message };
  }
}

// ===== 구독 복원 =====
export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active.premium !== undefined;

    return {
      success: true,
      isPremium,
      customerInfo,
    };
  } catch (error) {
    console.error('구독 복원 실패:', error);
    return { success: false, error: error.message };
  }
}

// ===== 사용량 추적 =====
export async function trackUsage() {
  const store = useAppStore.getState();
  store.incrementUsage();
}

// ===== 구독 상태 확인 훅 =====
export function useSubscription() {
  const subscription = useAppStore((state) => state.subscription);

  return {
    isPremium: subscription.isPremium,
    tier: subscription.tier,
    expiresAt: subscription.expiresAt,
    dailyUses: subscription.dailyUses,
    canUse: useAppStore.getState().canUse,
    isFree: !subscription.isPremium,
    isMonthly: subscription.tier === 'monthly',
    isYearly: subscription.tier === 'yearly',
  };
}

// ===== 테스트용 함수 =====
export function setMockSubscription(tier = 'free') {
  const store = useAppStore.getState();
  store.setSubscription({
    isPremium: tier !== 'free',
    tier,
    expiresAt: tier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    dailyUses: 0,
    lastUsedDate: null,
  });
}
