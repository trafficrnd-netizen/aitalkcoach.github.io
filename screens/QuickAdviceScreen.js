/**
 * 빠른 조언 스크린
 *
 * 클립보드/버블/긴 텍스트에서 핵심만 빠르게 한 줄 조언을 받는 화면.
 * 감정분석의 한 줄 조언 카드와 동일한 컴포넌트를 큰 화면으로 보여줌.
 *
 * 진입 경로:
 *  - FloatingBubble 탭 (clipboard)
 *  - Auto-incoming 텍스트가 "한 줄" 일 때 (선택지가 1개면 자동 진입 가능)
 *  - 사용자가 직접 /quick-advice 라우트 진입
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Button, IconButton, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { createAnalyzer } from '../ai-engine/analyzer';
import { parseKakaoTalkFile } from '../kakaotalk-parser/parser';
import { useAppStore } from '../store/appStore';
import { colors, spacing, radius, shadow, typography, analysisMode as modeMeta } from '../app/theme';

export default function QuickAdviceScreen() {
  const router = useRouter();
  const storeText = useAppStore((s) => s.currentAnalysisText);
  const setCurrentAnalysis = useAppStore((s) => s.setCurrentAnalysis);
  const setAnalysisMode = useAppStore((s) => s.setAnalysisMode);

  const [sourceText, setSourceText] = useState(typeof storeText === 'string' ? storeText : '');
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState(null);

  // store 텍스트 우선, 없으면 클립보드
  useEffect(() => {
    if (typeof storeText === 'string' && storeText.trim().length > 0) {
      setSourceText(storeText);
      return;
    }
    (async () => {
      try {
        const has = await Clipboard.hasStringAsync();
        if (!has) return;
        const text = await Clipboard.getStringAsync();
        if (text && text.trim().length > 0) {
          setSourceText(text);
          setCurrentAnalysis(text, 'clipboard', null, 'quick');
        }
      } catch {
        // silent
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = useCallback(async () => {
    const text = (sourceText || '').trim();
    if (text.length < 5) {
      Alert.alert('알림', '조언을 받으려면 텍스트를 5자 이상 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAdvice(null);
    try {
      // 파서로 메시지화 (실패해도 raw 텍스트로 fallback)
      let convo = text;
      try {
        const parsed = parseKakaoTalkFile(text);
        if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          convo = parsed.messages
            .map((m) => `${m.sender || (m.isFromMe ? '나' : '상대방')}: ${m.content}`)
            .join('\n');
        }
      } catch {
        // ignore
      }

      const analyzer = createAnalyzer({ useOnDevice: true });
      analyzer.setConversation(convo);
      const result = await analyzer.analyze({ types: ['quick_advice'] });
      if (result.success && result.results?.quick_advice) {
        setAdvice(result.results.quick_advice);
      } else {
        setError('조언을 만드는 중 문제가 생겼어요.');
      }
    } catch (e) {
      console.error(e);
      setError('조언을 만드는 중 문제가 생겼어요.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceText]);

  // 자동 실행 (텍스트가 있으면 마운트 시 1회)
  useEffect(() => {
    if (sourceText && sourceText.trim().length >= 5 && !advice && !isLoading && !error) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const handleGoFull = useCallback(() => {
    // 빠른 조언 → 풀 분석 (감정분석 모드)로 전환
    if (typeof sourceText === 'string' && sourceText.trim().length > 0) {
      setCurrentAnalysis(sourceText, 'clipboard', null, 'emotion');
      setAnalysisMode('emotion');
    }
    router.replace('/analysis');
  }, [sourceText, setCurrentAnalysis, setAnalysisMode, router]);

  const handleCopy = useCallback(async () => {
    if (!advice?.advice) return;
    try {
      await Clipboard.setStringAsync(advice.advice);
      Alert.alert('복사 완료!', '카톡에 붙여넣기 하세요.');
    } catch (e) {
      Alert.alert('실패', '복사하지 못했어요.');
    }
  }, [advice]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={handleClose} iconColor={colors.textPrimary} size={22} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{modeMeta.quick.icon} {modeMeta.quick.label}</Text>
          <Text style={styles.headerSubtitle}>{modeMeta.quick.description}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 입력 텍스트 미리보기 */}
        <Card style={styles.previewCard}>
          <Card.Content>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>📝 입력 텍스트</Text>
              <Chip
                icon="clipboard"
                style={styles.previewChip}
                textStyle={styles.previewChipText}
              >
                {sourceText.length}자
              </Chip>
            </View>
            <Text style={styles.previewText} numberOfLines={6}>
              {sourceText || '(텍스트 없음 — 클립보드에 카톡 대화를 복사하면 자동으로 채워져요)'}
            </Text>
          </Card.Content>
        </Card>

        {/* 로딩 / 결과 */}
        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={modeMeta.quick.color} />
            <Text style={styles.loadingText}>조언을 만들고 있어요...</Text>
          </View>
        )}

        {error && !isLoading && (
          <Card style={[styles.card, { backgroundColor: colors.negativeSoft }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.negative }]}>😥 {error}</Text>
              <Button mode="outlined" onPress={handleAnalyze} textColor={colors.negative}>
                다시 시도
              </Button>
            </Card.Content>
          </Card>
        )}

        {advice && !isLoading && (
          <Card style={[styles.adviceCard]}>
            <Card.Content>
              <View style={styles.adviceHeader}>
                <Text style={styles.adviceEmoji}>{advice.emoji || '💡'}</Text>
                <Text style={[styles.adviceLabel, { color: modeMeta.quick.color }]}>
                  {advice.headline || '한 줄 조언'}
                </Text>
              </View>
              <Text style={styles.adviceText}>{advice.advice}</Text>
              <View style={styles.adviceActions}>
                <Button
                  mode="outlined"
                  icon="content-copy"
                  onPress={handleCopy}
                  style={styles.actionButton}
                  textColor={modeMeta.quick.color}
                >
                  복사
                </Button>
                <Button
                  mode="contained"
                  icon="chart-line"
                  onPress={handleGoFull}
                  style={[styles.actionButton, { backgroundColor: modeMeta.quick.color }]}
                >
                  전체 분석
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 빈 상태 */}
        {!isLoading && !advice && !error && sourceText.trim().length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>텍스트가 비어 있어요</Text>
            <Text style={styles.emptyDesc}>
              카톡 대사를 복사하거나{'\n'}
              알림을 받으면 자동으로 채워져요.
            </Text>
            <Button
              mode="contained"
              icon="clipboard-text"
              onPress={async () => {
                try {
                  const has = await Clipboard.hasStringAsync();
                  if (!has) {
                    Alert.alert('알림', '클립보드가 비어 있어요.');
                    return;
                  }
                  const t = await Clipboard.getStringAsync();
                  if (t) {
                    setSourceText(t);
                    setCurrentAnalysis(t, 'clipboard', null, 'quick');
                  }
                } catch {
                  Alert.alert('실패', '클립보드를 읽지 못했어요.');
                }
              }}
              style={styles.emptyButton}
              buttonColor={modeMeta.quick.color}
            >
              클립보드에서 가져오기
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 44,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  previewCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  previewLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  previewChip: {
    backgroundColor: colors.surfaceMuted,
    height: 24,
  },
  previewChipText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginVertical: 1,
  },
  previewText: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.base,
  },

  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },

  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },

  adviceCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.card,
    borderWidth: 1.5,
    borderColor: modeMeta.quick.soft,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  adviceEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  adviceLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adviceText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.lg,
    marginBottom: spacing.lg,
  },
  adviceActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.md,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.size.base,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
});
