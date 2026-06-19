/**
 * 프리미엄 업그레이드 스크린
 *
 * 구독 플로우 및 요금제 선택
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Button, Card, IconButton, Surface } from 'react-native-paper';
import { useSubscription } from '../services/revenuecat';
import { getSubscriptionProducts, purchaseSubscription, restorePurchases } from '../services/revenuecat';
import { useAppStore } from '../store/appStore';

function SubscriptionScreen({ onBack }) {
  const [products, setProducts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const { isPremium } = useSubscription();
  const { setSubscription } = useAppStore();

  // ===== 상품 조회 =====
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const result = await getSubscriptionProducts();
      setProducts(result);
      setIsLoading(false);
    };
    loadProducts();
  }, []);

  // ===== 구매 처리 =====
  const handlePurchase = async (packageType) => {
    if (!products) {
      Alert.alert('오류', '구독 상품을 불러올 수 없습니다.');
      return;
    }

    const packageToPurchase =
      packageType === 'yearly' ? products.yearly : products.monthly;

    if (!packageToPurchase) {
      Alert.alert('오류', '선택한 구독 상품을 찾을 수 없습니다.');
      return;
    }

    setIsPurchasing(true);

    try {
      const result = await purchaseSubscription(packageToPurchase);

      if (result.success && result.isPremium) {
        const tier = packageType === 'yearly' ? 'yearly' : 'monthly';

        setSubscription({
          isPremium: true,
          tier,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          dailyUses: 0,
          lastUsedDate: null,
        });

        Alert.alert(
          '구독 완료! 🎉',
          '프리미엄 구독이 활성화되었습니다. 이제 무제한으로 대화를 분석해보세요!',
          [{ text: '확인' }]
        );
      } else if (result.cancelled) {
        // 사용자가 취소
      } else {
        Alert.alert('구매 실패', result.error || '구매 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '구매 처리 중 오류가 발생했습니다.');
      console.error('구매 오류:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  // ===== 복원 =====
  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const result = await restorePurchases();

      if (result.success && result.isPremium) {
        setSubscription({
          isPremium: true,
          tier: 'restored',
          expiresAt: result.customerInfo.entitlements.active.premium?.expirationDate || null,
          dailyUses: 0,
          lastUsedDate: null,
        });
        Alert.alert('복원 완료', '이전 구독이 복원되었습니다.');
      } else {
        Alert.alert('복원 실패', '구독 복원 결과가 없습니다. 먼저 구독을 구매해주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '구독 복원 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 이미 프리미엄 =====
  if (isPremium) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <IconButton icon="check-circle" size={80} iconColor="#10B981" />
          <Text style={styles.title}>이미 프리미엄입니다!</Text>
          <Text style={styles.subtitle}>
            모든 기능을 무제한으로 이용하실 수 있습니다.
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>프리미엄 혜택</Text>
            <View style={styles.benefitList}>
              {[
                '무제한 대화 분석',
                '상세 감정 분석',
                '맞춤형 조언 제공',
                '맞춤 답장 추천',
                '대화 요약 기능',
              ].map((benefit, i) => (
                <View key={i} style={styles.benefitItem}>
                  <IconButton icon="check" size={20} iconColor="#10B981" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Button mode="outlined" onPress={handleRestore} style={styles.restoreButton}>
          구독 복원
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>프리미엄으로 업그레이드</Text>
        <Text style={styles.subtitle}>
          모든 기능을 무제한으로 이용하고{'\n'}
          더 나은 관계를 만들어보세요
        </Text>
      </View>

      {/* 요금제 선택 */}
      <View style={styles.plans}>
        {/* 연간 플랜 */}
        <TouchablePlan
          name="연간 구독"
          price="4,900원"
          period="/년"
          originalPrice="58,800원"
          savings="33% 절약"
          badge="BEST"
          isSelected={selectedPlan === 'yearly'}
          onSelect={() => setSelectedPlan('yearly')}
          monthlyEquivalent="약 408원/월"
        />

        {/* 월간 플랜 */}
        <TouchablePlan
          name="월간 구독"
          price="900원"
          period="/월"
          savings={null}
          badge=" basics"
          isSelected={selectedPlan === 'monthly'}
          onSelect={() => setSelectedPlan('monthly')}
          monthlyEquivalent={null}
        />
      </View>

      {/* 혜택 안내 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>프리미엄 혜택</Text>
          <View style={styles.benefitList}>
            {[
              { icon: 'infinity', text: '무제한 대화 분석' },
              { icon: 'heart-multiple', text: '상세 감정 분석' },
              { icon: 'lightbulb', text: '맞춤형 조언 제공' },
              { icon: 'message-reply-text', text: '맞춤 답장 추천' },
              { icon: 'file-document-multiple', text: '대화 요약 기능' },
            ].map((item, i) => (
              <View key={i} style={styles.benefitItem}>
                <IconButton icon={item.icon} size={20} iconColor="#6366F1" />
                <Text style={styles.benefitText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* 구매 버튼 */}
      <Button
        mode="contained"
        style={styles.subscribeButton}
        contentStyle={styles.subscribeButtonContent}
        onPress={() => handlePurchase(selectedPlan)}
        loading={isPurchasing}
        disabled={isPurchasing}
      >
        {selectedPlan === 'yearly'
          ? '연간 구독하기 (4,900원/년)'
          : '월간 구독하기 (900원/월)'}
      </Button>

      {/* 복원 버튼 */}
      <Button
        mode="text"
        onPress={handleRestore}
        disabled={isLoading}
        style={styles.restoreButton}
      >
        이전 구매 내용 복원
      </Button>

      {/* 안내 문구 */}
      <Surface style={styles.infoBox} elevation={0}>
        <Text style={styles.infoText}>
          💳 결제는 Apple ID 결제로 이루어집니다.{'\n'}
          📅 구독은 자동으로 갱신됩니다.{'\n'}
          ⚙️ 설정 > Apple ID > 구독에서 언제든지 취소할 수 있습니다.{'\n'}
          🔄 7일 이내 환불 정책이 적용됩니다.
        </Text>
      </Surface>

      {/* 로고 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by RevenueCat</Text>
      </View>
    </ScrollView>
  );
}

// ===== 선택 가능한 요금제 카드 =====
function TouchablePlan({
  name,
  price,
  period,
  originalPrice,
  savings,
  badge,
  isSelected,
  onSelect,
  monthlyEquivalent,
}) {
  return (
    <Card
      style={[styles.planCard, isSelected && styles.planCardSelected]}
      onPress={onSelect}
    >
      <Card.Content>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{name}</Text>
          {badge && (
            <Surface style={styles.badge} elevation={0}>
              <Text style={styles.badgeText}>{badge}</Text>
            </Surface>
          )}
        </View>

        <View style={styles.planPrice}>
          <Text style={styles.priceText}>{price}</Text>
          <Text style={styles.periodText}>{period}</Text>
        </View>

        {originalPrice && (
          <Text style={styles.originalPrice}>{originalPrice}</Text>
        )}

        {savings && (
          <Text style={styles.savingsText}>{savings}</Text>
        )}

        {monthlyEquivalent && (
          <Text style={styles.monthlyEquivalent}>{monthlyEquivalent}</Text>
        )}

        {/* 선택 표시 */}
        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
          <View style={[styles.radioInner, isSelected && styles.radioInnerSelected]} />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  crown: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  plans: {
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  periodText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 2,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  monthlyEquivalent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  radioOuter: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  radioInnerSelected: {
    backgroundColor: '#6366F1',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  benefitList: {},
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  subscribeButton: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  subscribeButtonContent: {
    paddingVertical: 8,
  },
  restoreButton: {
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});

export default SubscriptionScreen;
