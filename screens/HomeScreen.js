/**
 * 홈 스크린
 *
 * 메인 화면 - 파일 업로드 및 분석 시작
 */

import React, { useState } from 'react';
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
import * as FileSystem from 'expo-file-system';

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

  const { canUse, dailyUses, isPremium } = useSubscription();
  const { addToHistory, setCurrentChat, setAnalysisResult } = useAppStore();

  // ===== 파일 선택 =====
  const handleFilePick = async () => {
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
      // 파일 읽기
      const content = await FileSystem.readAsStringAsync(selectedFile.uri);

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
      const analysisText = toAnalysisText(parsed);

      // 스토어에 저장
      setCurrentChat(chatData);
      addToHistory(chatData);

      // 분석 화면으로 이동
      onNavigate('analysis', { chatData, analysisText });

    } catch (error) {
      Alert.alert('오류', '파일을 처리하는 중 오류가 발생했습니다.');
      console.error('분석 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== 최근 대화 보기 =====
  const handleViewRecent = (chat) => {
    const analysisText = toAnalysisText(chat);
    setCurrentChat(chat);
    onNavigate('analysis', { chatData: chat, analysisText, isRecent: true });
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

      {/* 프리미엄 배너 (무료 사용자) */}
      {!isPremium && <PremiumBanner onPress={() => onNavigate('subscription')} />}

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

      {/* 파일 선택 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>카카오톡 대화 파일</Text>
          <Text style={styles.cardDescription}>
            카카오톡 > 설정 > 대화 > 대화 내보내기로 파일을 내보내고 선택해주세요.
          </Text>

          <TouchableOpacity
            style={styles.fileButton}
            onPress={handleFilePick}
            disabled={isProcessing}
          >
            <IconButton icon="file-upload" size={32} />
            <Text style={styles.fileButtonText}>
              {selectedFile ? selectedFile.name : '파일 선택하기'}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.selectedFileInfo}>
              <Chip icon="check-circle" style={styles.chip}>
                파일 선택됨
              </Chip>
              <Text style={styles.fileSize}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 분석 시작 버튼 */}
      <Button
        mode="contained"
        style={styles.analyzeButton}
        contentStyle={styles.analyzeButtonContent}
        onPress={handleStartAnalysis}
        loading={isProcessing}
        disabled={!selectedFile || isProcessing}
      >
        AI 분석 시작
      </Button>

      {/* 사용 방법 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>사용 방법</Text>
          <View style={styles.steps}>
            <Step number={1} text="카카오톡에서 대화 내보내기" />
            <Step number={2} text="파일 선택 후 분석 시작" />
            <Step number={3} text="AI 분석 결과 확인" />
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
  fileButtonText: {
    fontSize: 16,
    color: '#6366F1',
    marginLeft: 8,
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
