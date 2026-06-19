/**
 * 플로팅 분석 화면 (모달)
 *
 * 플로팅 버블 탭 시 클립보드 내용을 분석하는 오버레이 화면
 */

import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, IconButton, Card, ActivityIndicator } from 'react-native-paper';
import { useState, useCallback, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { parseKakaoTalkFile, validateChatData, toAnalysisText } from '../kakaotalk-parser/parser';
import { createAnalyzer } from '../ai-engine/analyzer';
import { useAppStore } from '../store/appStore';

export default function FloatingAnalysisScreen() {
  const router = useRouter();
  const { canUse, incrementUsage } = useAppStore();

  const [clipboardText, setClipboardText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // ===== 클립보드 읽기 =====
  useEffect(() => {
    const loadClipboard = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text && text.trim().length > 0) {
          setClipboardText(text);
        } else {
          setError('클립보드에 텍스트가 없습니다.');
        }
      } catch (err) {
        setError('클립보드를 읽을 수 없습니다.');
      }
    };
    loadClipboard();
  }, []);

  // ===== 분석 실행 =====
  const handleAnalyze = useCallback(async () => {
    if (!clipboardText) return;

    // 사용량 체크
    const check = canUse();
    if (!check.allowed) {
      Alert.alert('일일 사용량 초과', check.message, [
        { text: '구독하기', onPress: () => router.replace('/subscription') },
        { text: '닫기', style: 'cancel' },
      ]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 파싱
      const parsed = parseKakaoTalkFile(clipboardText);
      const validation = validateChatData(parsed);

      if (!validation.isValid) {
        setError(validation.errors[0] || '대화 형식이 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      // AI 분석
      const analysisText = toAnalysisText(parsed);
      const analyzer = createAnalyzer();
      analyzer.setConversation(analysisText);
      incrementUsage();

      const result = await analyzer.analyze({ types: ['emotion', 'interest', 'advice', 'replies'] });

      if (result.success) {
        setAnalysisResult(result.results);
      } else {
        setError('분석 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('분석 오류:', err);
      setError('분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [clipboardText]);

  // ===== 답장 복사 =====
  const handleCopyReply = useCallback((reply) => {
    Clipboard.setString(reply);
    Alert.alert('복사 완료!', '카카오톡에 붙여넣기 하세요.');
  }, []);

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={handleClose} />
        <Text style={styles.headerTitle}>클립보드 분석</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 클립보드 미리보기 */}
        <Card style={styles.previewCard}>
          <Card.Content>
            <Text style={styles.previewLabel}>📋 클립보드 내용</Text>
            <Text style={styles.previewText} numberOfLines={8}>
              {clipboardText || '읽는 중...'}
            </Text>
          </Card.Content>
        </Card>

        {/* 에러 */}
        {error && (
          <Card style={[styles.previewCard, styles.errorCard]}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
              <Button mode="outlined" onPress={handleClose} style={styles.retryButton}>
                닫기
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* 분석 결과 */}
        {analysisResult && (
          <View>
            {/* 감정 */}
            {analysisResult.emotion && (
              <Card style={styles.resultCard}>
                <Card.Content>
                  <Text style={styles.resultTitle}>💭 감정</Text>
                  <Text style={styles.resultEmoji}>
                    {analysisResult.emotion.emotion === '긍정적' ? '😊' :
                     analysisResult.emotion.emotion === '부정적' ? '😢' : '😐'}
                  </Text>
                  <Text style={styles.resultValue}>
                    {analysisResult.emotion.emotion || analysisResult.emotion.overall} (
                    {analysisResult.emotion.emotion_score || analysisResult.emotion.score}/10)
                  </Text>
                  {analysisResult.emotion.description && (
                    <Text style={styles.resultDesc}>{analysisResult.emotion.description}</Text>
                  )}
                </Card.Content>
              </Card>
            )}

            {/* 관심도 */}
            {analysisResult.interest && (
              <Card style={styles.resultCard}>
                <Card.Content>
                  <Text style={styles.resultTitle}>❤️ 관심도</Text>
                  <Text style={styles.resultValue}>
                    {analysisResult.interest.interest_level || analysisResult.interest.level}
                    ({analysisResult.interest.interest_score || analysisResult.interest.score}/10)
                  </Text>
                  {analysisResult.interest.evidence && analysisResult.interest.evidence[0] && (
                    <Text style={styles.resultDesc}>근거: {analysisResult.interest.evidence[0]}</Text>
                  )}
                </Card.Content>
              </Card>
            )}

            {/* 추천 답장 */}
            {(analysisResult.replies?.suggestions || analysisResult.comprehensive?.replies || []) .slice(0, 3).map((reply, index) => {
              const replyText = typeof reply === 'string' ? reply : reply.reply;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.replyItem}
                  onPress={() => handleCopyReply(replyText)}
                  activeOpacity={0.7}
                >
                  <View style={styles.replyNumber}>
                    <Text style={styles.replyNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.replyText}>{replyText}</Text>
                  <IconButton icon="content-copy" size={16} iconColor="#6366F1" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      {!analysisResult && !error && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleAnalyze}
            loading={isLoading}
            disabled={isLoading || !clipboardText}
            style={styles.analyzeButton}
            contentStyle={styles.analyzeButtonContent}
          >
            {isLoading ? '분석 중...' : 'AI 분석하기'}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 48,
    paddingBottom: 8,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  previewCard: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#1F2937',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 20,
  },
  errorCard: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    borderColor: '#EF4444',
  },
  resultCard: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#1F2937',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  resultEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  replyNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  replyNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  replyText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#1F2937',
  },
  analyzeButton: {
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  analyzeButtonContent: {
    paddingVertical: 8,
  },
});
