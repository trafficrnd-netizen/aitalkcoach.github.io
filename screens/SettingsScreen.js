/**
 * 설정 화면
 *
 * 다크모드, 데이터 관리, 구독 관리 등 설정 기능
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  List,
  Switch,
  Divider,
  Button,
  Dialog,
  Portal,
  RadioButton,
} from 'react-native-paper';
import { useAppStore } from '../store/appStore';
import { useSubscription } from '../services/revenuecat';

function SettingsScreen({ onBack, onNavigate }) {
  const {
    isDarkMode,
    toggleDarkMode,
    clearHistory,
    clearCache,
    version,
    dailyLimit,
  } = useAppStore();

  const { isPremium, tier } = useSubscription();

  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [clearType, setClearType] = useState(null);

  // ===== 데이터 삭제 =====
  const handleClearData = (type) => {
    setClearType(type);
    setClearDialogVisible(true);
  };

  const confirmClearData = () => {
    if (clearType === 'history') {
      clearHistory();
      Alert.alert('완료', '분석 히스토리가 삭제되었습니다.');
    } else if (clearType === 'cache') {
      clearCache();
      Alert.alert('완료', '캐시가 삭제되었습니다.');
    } else if (clearType === 'all') {
      clearHistory();
      clearCache();
      Alert.alert('완료', '모든 데이터가 삭제되었습니다.');
    }
    setClearDialogVisible(false);
  };

  // ===== 구독 관리 =====
  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root&path=STORE');
    } else {
      Linking.openURL('market://details?id=com.aitalkcoach.app');
    }
  };

  // ===== 문의하기 =====
  const handleContact = () => {
    Linking.openURL('mailto:support@aitalkcoach.app?subject=AI톡코치 문의');
  };

  // ===== 리뷰 작성 =====
  const handleWriteReview = () => {
    const appId = Platform.OS === 'ios'
      ? 'id0000000000'
      : 'com.aitalkcoach.app';
    Linking.openURL(
      Platform.OS === 'ios'
        ? `https://apps.apple.com/app/id${appId}?action=write-review`
        : `market://details?id=${appId}`
    );
  };

  // ===== 공유하기 =====
  const handleShare = () => {
    Alert.alert(
      '친구에게 공유하기',
      'AI톡 코치를 친구에게 추천해주세요!',
      [{ text: '확인' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={onBack}
          style={styles.backButton}
        >
          뒤로
        </Button>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* 구독 정보 */}
        {isPremium && (
          <View style={styles.subscriptionBanner}>
            <Text style={styles.subscriptionEmoji}>👑</Text>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionTitle}>프리미엄 활성화</Text>
              <Text style={styles.subscriptionSubtitle}>
                {tier === 'yearly' ? '연간 구독' : '월간 구독'} 이용 중
              </Text>
            </View>
          </View>
        )}

        {/* 외관 */}
        <Text style={styles.sectionTitle}>외관</Text>
        <Card style={styles.card}>
          <List.Item
            title="다크 모드"
            description="어두운 테마로 전환"
            left={(props) => <List.Icon {...props} icon="brightness-6" />}
            right={() => (
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                color="#6366F1"
              />
            )}
          />
        </Card>

        {/* 데이터 관리 */}
        <Text style={styles.sectionTitle}>데이터 관리</Text>
        <Card style={styles.card}>
          <List.Item
            title="분석 히스토리"
            description="이전 분석 기록 보기"
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => onNavigate('history')}
          />
          <Divider />
          <List.Item
            title="히스토리 삭제"
            description="모든 분석 기록 삭제"
            left={(props) => <List.Icon {...props} icon="delete-outline" />}
            onPress={() => handleClearData('history')}
          />
          <Divider />
          <List.Item
            title="캐시 삭제"
            description="임시 파일 삭제"
            left={(props) => <List.Icon {...props} icon="cached" />}
            onPress={() => handleClearData('cache')}
          />
          <Divider />
          <List.Item
            title="모든 데이터 삭제"
            description="앱 데이터 전체 삭제"
            titleStyle={{ color: '#EF4444' }}
            left={(props) => <List.Icon {...props} icon="delete-forever" color="#EF4444" />}
            onPress={() => handleClearData('all')}
          />
        </Card>

        {/* 구독 */}
        <Text style={styles.sectionTitle}>구독</Text>
        <Card style={styles.card}>
          {isPremium ? (
            <>
              <List.Item
                title="구독 관리"
                description="Apple ID에서 구독 관리"
                left={(props) => <List.Icon {...props} icon="credit-card-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleManageSubscription}
              />
              <Divider />
              <List.Item
                title="구독 복원"
                description="이전 구매 내용 복원"
                left={(props) => <List.Icon {...props} icon="restore" />}
                onPress={() => onNavigate('subscription')}
              />
            </>
          ) : (
            <List.Item
              title="프리미엄 업그레이드"
              description="무제한 분석 + 상세 조언"
              left={(props) => <List.Icon {...props} icon="crown" color="#F59E0B" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => onNavigate('subscription')}
            />
          )}
        </Card>

        {/* 일반 */}
        <Text style={styles.sectionTitle}>일반</Text>
        <Card style={styles.card}>
          <List.Item
            title="사용법"
            description="AI톡 코치 사용 방법"
            left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => onNavigate('howto')}
          />
          <Divider />
          <List.Item
            title="친구에게 공유"
            description="앱을 친구에게 추천"
            left={(props) => <List.Icon {...props} icon="share-variant" />}
            onPress={handleShare}
          />
          <Divider />
          <List.Item
            title="앱 리뷰 작성"
            description="App Store에서 평가하기"
            left={(props) => <List.Icon {...props} icon="star-outline" />}
            onPress={handleWriteReview}
          />
          <Divider />
          <List.Item
            title="문의하기"
            description="support@aitalkcoach.app"
            left={(props) => <List.Icon {...props} icon="email-outline" />}
            onPress={handleContact}
          />
          <Divider />
          <List.Item
            title="개인정보 처리방침"
            left={(props) => <List.Icon {...props} icon="shield-lock-outline" />}
            onPress={() => Linking.openURL('https://aitalkcoach.app/privacy')}
          />
          <Divider />
          <List.Item
            title="이용약관"
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            onPress={() => Linking.openURL('https://aitalkcoach.app/terms')}
          />
        </Card>

        {/* 버전 정보 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AI톡 코치</Text>
          <Text style={styles.versionText}>버전 {version || '1.0.0'}</Text>
          <Text style={styles.copyrightText}>
            © 2024 AI Talk Coach. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* 삭제 확인 다이얼로그 */}
      <Portal>
        <Dialog
          visible={clearDialogVisible}
          onDismiss={() => setClearDialogVisible(false)}
        >
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={styles.dialogTitle}>
            {clearType === 'all' ? '모든 데이터 삭제' : '데이터 삭제'}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              {clearType === 'history' && '분석 히스토리가 영구적으로 삭제됩니다.'}
              {clearType === 'cache' && '캐시 파일이 삭제됩니다.'}
              {clearType === 'all' && '모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>취소</Button>
            <Button
              onPress={confirmClearData}
              textColor="#EF4444"
            >
              삭제
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// ===== 스타일 =====

function Card({ children, style }) {
  return <View style={[styles.cardContainer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 64,
  },
  content: {
    flex: 1,
  },
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  subscriptionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  subscriptionSubtitle: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 8,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  dialogContent: {
    textAlign: 'center',
    color: '#6B7280',
  },
});

export default SettingsScreen;
