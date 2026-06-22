/**
 * 홈 스크린
 *
 * 메인 화면 - 파일 업로드 및 분석 시작
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Button, Card, IconButton, Chip, Surface } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';

// 컴포넌트
import PremiumBanner from '../components/PremiumBanner';

// 서비스
import { parseKakaoTalkFile, validateChatData, toAnalysisText } from '../kakaotalk-parser/parser';
import { useSubscription } from '../services/revenuecat';
import { useAppStore } from '../store/appStore';

function HomeScreen({ onNavigate, onSettings }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [clipboardText, setClipboardText] = useState(null);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  const { canUse, dailyUses, isPremium } = useSubscription();
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const currentUser = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const { addToHistory, setCurrentChat, setCurrentAnalysis, setAnalysisResult } = useAppStore();

  // 비로그인 시 모든 주요 액션 차단
  const requireLogin = () => {
    if (!isLoggedIn) {
      Alert.alert(
        '로그인 필요',
        '분석 기능을 사용하려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인하기', onPress: () => onNavigate('login') },
        ],
      );
      return false;
    }
    return true;
  };

  // ===== 클립보드 미리보기 (마운트 시 1회) =====
  useEffect(() => {
    (async () => {
      try {
        const has = await Clipboard.hasStringAsync();
        setClipboardSupported(true);
        if (has) {
          const t = await Clipboard.getStringAsync();
          if (t && t.trim().length > 0) {
            setClipboardText(t);
          }
        }
      } catch {
        setClipboardSupported(false);
      }
    })();
  }, []);

  // ===== 클립보드에서 가져오기 =====
  const handlePickFromClipboard = async () => {
    if (!requireLogin()) return;
    try {
      const has = await Clipboard.hasStringAsync();
      if (!has) {
        Alert.alert('알림', '클립보드가 비어 있어요. 카톡에서 텍스트를 복사한 뒤 다시 시도해주세요.');
        return;
      }
      const text = await Clipboard.getStringAsync();
      if (!text || text.trim().length < 5) {
        Alert.alert('알림', '클립보드 텍스트가 너무 짧아요 (5자 이상).');
        return;
      }

      // 사용량 체크
      const check = canUse();
      if (!check.allowed) {
        Alert.alert('일일 사용량 초과', check.message, [
          { text: '구독하기', onPress: () => onNavigate('subscription') },
        ]);
        return;
      }

      setCurrentChat(null);
      setCurrentAnalysis(text.trim(), 'clipboard');
      // 메시지 선택 화면으로 (선택 안하면 전체 분석)
      onNavigate('select-text');
    } catch (error) {
      Alert.alert('오류', '클립보드를 읽을 수 없습니다.');
      console.error('클립보드 읽기 오류:', error);
    }
  };

  // ===== 클립보드 새로고침 =====
  const handleRefreshClipboard = async () => {
    try {
      const has = await Clipboard.hasStringAsync();
      if (has) {
        const t = await Clipboard.getStringAsync();
        if (t && t.trim().length > 0) {
          setClipboardText(t);
          return;
        }
      }
      setClipboardText(null);
      Alert.alert('알림', '클립보드가 비어 있어요.');
    } catch (e) {
      // ignore
    }
  };

  // ===== 파일 선택 =====
  const handleFilePick = async () => {
    if (!requireLogin()) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile({
        name: file.name,
        uri: file.uri,
        size: file.size,
      });
    } catch (error) {
      Alert.alert('오류', '파일을 선택할 수 없습니다.');
      console.error('파일 선택 오류:', error);
    }
  };

  // ===== 분석 시작 =====
  const handleStartAnalysis = async () => {
    if (!requireLogin()) return;
    if (!selectedFile) {
      Alert.alert('알림', '분석할 파일을 선택해주세요.');
      return;
    }

    // 사용량 체크
    const check = canUse();
    if (!check.allowed) {
      Alert.alert(
        '일일 사용량 초과',
        check.message,
        [{ text: '구독하기', onPress: () => onNavigate('subscription') }]
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 파일 읽기 — fetch()로 직접 URI 읽기 (expo-file-system deprecated 회피)
      let content = '';
      try {
        const response = await fetch(selectedFile.uri);
        content = await response.text();
      } catch (e1) {
        // legacy API fallback
        try {
          content = await FileSystem.readAsStringAsync(selectedFile.uri);
        } catch (e2) {
          console.warn('파일 읽기 실패:', e2.message);
          content = '';
        }
      }

      // 파싱
      const parsed = parseKakaoTalkFile(content);
      const validation = validateChatData(parsed);

      if (!validation.isValid) {
        Alert.alert('파싱 실패', validation.errors.join('\n'));
        setIsProcessing(false);
        return;
      }

      // 대화 데이터 설정
      const chatData = {
        id: Date.now().toString(),
        name: selectedFile.name,
        ...parsed,
        analyzedAt: new Date().toISOString(),
      };

      // AI 분석용 텍스트 변환
      // (parser 실패해도 raw content라도 분석기에 전달 → 빈 대화 에러 방지)
      const analysisText = toAnalysisText(parsed) || content.slice(0, 8000);

      // store에 chatData + 분석 텍스트 저장 (URL params로 넘기면 새 arch interop에서 잘림)
      setCurrentChat(chatData);
      setCurrentAnalysis(analysisText, 'file');
      addToHistory(chatData);

      // 분석 화면으로 이동 (route params로는 chatId만 — 짧은 string)
      onNavigate('analysis', { chatId: chatData.id, chatName: selectedFile.name });

    } catch (error) {
      Alert.alert('오류', '파일을 처리하는 중 오류가 발생했습니다.');
      console.error('분석 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== 최근 대화 보기 =====
  const handleViewRecent = (chat) => {
    if (!requireLogin()) return;
    const analysisText = toAnalysisText(chat);
    setCurrentChat(chat);
    setCurrentAnalysis(analysisText, 'recent');
    onNavigate('analysis', { chatId: chat.id, chatName: chat.name, isRecent: 'true' });
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          logout();
          setSelectedFile(null);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>AI톡 코치</Text>
          <IconButton
            icon="cog"
            size={24}
            iconColor="#6B7280"
            onPress={onSettings}
            style={styles.settingsButton}
          />
        </View>
        <Text style={styles.subtitle}>카카오톡 대화를 분석하고 조언을 받아보세요</Text>
      </View>

      {/* ===== 로그인 게이트 ===== */}
      {isLoggedIn ? (
        <Surface style={styles.userCard} elevation={1}>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(currentUser?.name || 'U').slice(0, 1)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser?.name || '사용자'}</Text>
              <Text style={styles.userMeta}>
                {currentUser?.provider === 'test' ? '🧪 테스트 계정' :
                 currentUser?.provider === 'google' ? '🇬 Google' :
                 currentUser?.provider === 'kakao' ? '💬 카카오' : '게스트'}
                {isPremium ? '  ·  👑 프리미엄' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      ) : (
        <Surface style={styles.loginPrompt} elevation={2}>
          <Text style={styles.loginPromptEmoji}>🔐</Text>
          <Text style={styles.loginPromptTitle}>로그인이 필요합니다</Text>
          <Text style={styles.loginPromptDesc}>
            분석 기능을 사용하려면 로그인해주세요.{'\n'}
            Google / 카카오 계정 또는 테스트 계정으로 즉시 시작할 수 있습니다.
          </Text>
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={() => onNavigate('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginPromptButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </Surface>
      )}

      {/* 프리미엄 배너 (무료 사용자) */}
      {!isPremium && isLoggedIn && (
        <PremiumBanner onPress={() => onNavigate('subscription')} />
      )}

      {/* 사용량 표시 */}
      <Surface style={styles.usageCard} elevation={1}>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>오늘 사용량</Text>
          <Text style={styles.usageValue}>
            {isPremium ? '무제한' : `${dailyUses} / 3회`}
          </Text>
        </View>
        {!isPremium && (
          <Text style={styles.usageHint}>
            프리미엄 구독 시 무제한 분석 + 상세 조언 제공
          </Text>
        )}
      </Surface>

      {/* 분석 소스 선택 — 클립보드 vs 파일 */}
      <Text style={styles.sectionTitle}>📥 분석할 텍스트 가져오기</Text>
      <Text style={styles.sectionDesc}>
        두 가지 방법 중 편한 걸로 선택하세요. 카톡에서 복사한 텍스트 또는 내보낸 파일을 분석할 수 있어요.
      </Text>

      <View style={styles.sourceRow}>
        {/* ===== 클립보드 카드 ===== */}
        <TouchableOpacity
          style={[
            styles.sourceCard,
            styles.clipboardCard,
            !isLoggedIn && styles.sourceCardDisabled,
          ]}
          onPress={handlePickFromClipboard}
          disabled={!isLoggedIn || isProcessing}
          activeOpacity={isLoggedIn ? 0.75 : 1}
        >
          <View style={[styles.sourceIcon, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.sourceIconText}>📋</Text>
          </View>
          <Text style={styles.sourceCardTitle}>클립보드</Text>
          <Text style={styles.sourceCardDesc}>
            {clipboardText
              ? `✅ ${clipboardText.length}자 복사됨`
              : clipboardSupported
              ? '📭 비어 있음'
              : '⚠️ 권한 필요'}
          </Text>
          {clipboardText && (
            <Text style={styles.sourceCardPreview} numberOfLines={2}>
              {clipboardText}
            </Text>
          )}
          <View style={styles.sourceCardActions}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); handleRefreshClipboard(); }}
              style={styles.sourceCardRefresh}
              activeOpacity={0.7}
            >
              <Text style={styles.sourceCardRefreshText}>↻ 새로고침</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* ===== 파일 카드 ===== */}
        <TouchableOpacity
          style={[
            styles.sourceCard,
            styles.fileCard,
            !isLoggedIn && styles.sourceCardDisabled,
          ]}
          onPress={handleFilePick}
          disabled={!isLoggedIn || isProcessing}
          activeOpacity={isLoggedIn ? 0.75 : 1}
        >
          <View style={[styles.sourceIcon, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.sourceIconText}>📄</Text>
          </View>
          <Text style={styles.sourceCardTitle}>파일</Text>
          <Text style={styles.sourceCardDesc}>
            {selectedFile
              ? `✅ ${selectedFile.name}`
              : '📂 선택하기'}
          </Text>
          {selectedFile && (
            <Text style={styles.sourceCardPreview} numberOfLines={2}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </Text>
          )}
          <View style={styles.sourceCardActions}>
            <Text style={styles.sourceCardHint}>
              카톡 → 대화방 → ⋮ → 내보내기
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 파일 선택 후 분석 시작 버튼 (파일 경로만 해당) */}
      {selectedFile && isLoggedIn && (
        <Button
          mode="contained"
          style={styles.analyzeButton}
          contentStyle={styles.analyzeButtonContent}
          onPress={handleStartAnalysis}
          loading={isProcessing}
        >
          📄 파일로 AI 분석 시작
        </Button>
      )}

      {/* 사용 방법 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>사용 방법</Text>
          <View style={styles.steps}>
            <Step number={1} text="클립보드로 텍스트 복사 또는 파일 선택" />
            <Step number={2} text="AI 분석 시작" />
            <Step number={3} text="분석 결과 확인 (요약 / 감정 / 관심도)" />
            <Step number={4} text="추천 답장 받아보기" />
          </View>
        </Card.Content>
      </Card>

      {/* 최근 분석 (히스토리) */}
      {recentChats.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>최근 분석</Text>
            {recentChats.slice(0, 3).map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.historyItem}
                onPress={() => handleViewRecent(chat)}
              >
                <IconButton icon="history" size={20} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{chat.name}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(chat.analyzedAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 푸터 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 모든 분석은 기기 내에서 이루어지며, 데이터는 외부로 전송되지 않습니다.
        </Text>
      </View>
    </ScrollView>
  );
}

// ===== 단계 표시 컴포넌트 =====
function Step({ number, text }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  settingsButton: {
    margin: 0,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },

  // ===== 로그인 상태 카드 =====
  userCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  userMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  // ===== 로그인 안내 카드 =====
  loginPrompt: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
  },
  loginPromptEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  loginPromptTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  loginPromptDesc: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  loginPromptButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  loginPromptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== 사용량 =====
  usageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  usageHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // ===== 분석 소스 선택 섹션 =====
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 19,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sourceCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    minHeight: 180,
  },
  clipboardCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F7FF',
  },
  fileCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  sourceCardDisabled: {
    opacity: 0.5,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sourceIconText: {
    fontSize: 22,
  },
  sourceCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sourceCardDesc: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },
  sourceCardPreview: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
    marginBottom: 8,
  },
  sourceCardActions: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceCardRefresh: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sourceCardRefreshText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  sourceCardHint: {
    fontSize: 10,
    color: '#92400E',
    fontStyle: 'italic',
  },

  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
  },
  fileButtonDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  fileButtonText: {
    fontSize: 16,
    color: '#6366F1',
    marginLeft: 8,
    fontWeight: '600',
  },
  fileButtonTextDisabled: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#10B981',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  analyzeButton: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  analyzeButtonContent: {
    paddingVertical: 8,
  },
  steps: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default HomeScreen;
