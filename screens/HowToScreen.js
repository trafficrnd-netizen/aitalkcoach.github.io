/**
 * 사용법 화면
 *
 * 4가지 분석 진입 경로를 안내:
 *  1) 파일 분석 (카톡 .txt 내보내기 → 업로드)
 *  2) 자동 유입 (카톡 알림/접근성 → /select-text)
 *  3) 말풍선 탭 (다른 앱에서 카톡 본문 → 빠른 조언)
 *  4) 카톡방 텍스트 선택 (접근성 → 말풍선 펼침 → 감정/업무 선택)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Button, Card, IconButton, ProgressBar } from 'react-native-paper';
import { colors, spacing, radius, shadow, typography } from '../app/theme';

// 화면 사이즈 반응형 (5인치~7인치 모두 대응)
function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const contentMaxWidth = isTablet ? 560 : undefined;
  const horizontalPad = isTablet ? spacing['3xl'] : spacing.lg;
  return { width, height, isTablet, contentMaxWidth, horizontalPad };
}

const METHODS = [
  {
    id: 'file',
    emoji: '📄',
    title: '파일 분석',
    subtitle: '긴 대화 / 전체 기록을 깊게 분석할 때',
    color: colors.modeEmotion,
    soft: colors.modeEmotionSoft,
    steps: [
      '카톡 → 대화방 → ⋮ 메뉴 → "대화 내보내기"',
      '형식을 "텍스트(.txt)"로 선택해 저장',
      'AI톡 코치 홈 → "파일 선택하기" → 저장한 .txt 선택',
      '분석 모드(감정/업무) 선택 → "AI 분석 시작"',
    ],
    when: '대화 내용이 많거나, 보관해둔 대화를 한 번에 분석하고 싶을 때',
  },
  {
    id: 'auto',
    emoji: '🔔',
    title: '자동 유입',
    subtitle: '카톡 알림이 오면 자동으로 분석 화면에 도착',
    color: colors.modeEmotion,
    soft: colors.modeEmotionSoft,
    steps: [
      '카톡 알림 접근성 권한 허용 (최초 1회)',
      '상대방이 메시지를 보내면 알림 발생',
      '알림에서 본문을 길게 누르거나 앱을 열면 자동 분석 대기',
      '"/select-text" 화면에서 분석할 메시지 선택',
      '감정/업무 모드 선택 → "AI 분석 시작"',
    ],
    when: '실시간으로 상대방 메시지가 도착했을 때, 가장 빠른 분석 경로',
  },
  {
    id: 'bubble',
    emoji: '💬',
    title: '말풍선 탭',
    subtitle: '다른 앱 위 떠 있는 ? 말풍선을 눌러 즉석 조언',
    color: colors.modeQuick,
    soft: colors.modeQuickSoft,
    steps: [
      '설정에서 "다른 앱에서도 AI 분석 켜기" 권한 허용',
      '카톡/메신저에서 받은 메시지를 길게 눌러 "복사"',
      '화면 우측 하단의 ? 말풍선 탭',
      '클립보드의 텍스트가 자동으로 채워짐',
      '"한 줄 조언" 카드 + "전체 분석" 버튼 제공',
    ],
    when: '복잡한 분석 없이 한 줄 조언만 빠르게 받고 싶을 때',
  },
  {
    id: 'select',
    emoji: '✂️',
    title: '카톡방 텍스트 선택 (베타)',
    subtitle: '카톡 채팅방에서 텍스트를 선택하면 말풍선이 펼쳐져요',
    color: colors.modeWork,
    soft: colors.modeWorkSoft,
    steps: [
      '카톡 채팅방에서 분석할 메시지를 길게 눌러 선택',
      '화면에 "?" 말풍선이 펼쳐짐',
      '말풍선 안에서 "감정분석" 또는 "업무분석" 선택',
      '선택한 텍스트가 앱으로 전달되어 분석 시작',
      '"채팅방으로" 버튼을 누르면 즉시 카톡으로 복귀',
    ],
    when: '카톡을 떠나지 않고 가볍게 분석하고 싶을 때',
  },
];

const TIPS = [
  { emoji: '💡', text: '분석은 100% 기기 내에서 이루어지며, 데이터가 외부로 전송되지 않습니다' },
  { emoji: '🔒', text: '복사한 카톡 본문은 분석 직후 메모리에서 비워져요 (저장 X)' },
  { emoji: '🎯', text: '업무 분석은 시간/장소/결정/액션 중심으로, 감정 분석은 톤/관심도 중심으로 정리해줘요' },
  { emoji: '⚠️', text: '카톡 알림 권한을 끄면 자동 유입이 동작하지 않아요' },
];

const FAQS = [
  {
    q: '어떤 카톡 파일을 지원하나요?',
    a: '카톡 → 대화 내보내기 → 텍스트(.txt) 형식으로 저장한 파일을 지원합니다. 미디어는 텍스트로 추출되지 않아 분석에서 제외돼요.',
  },
  {
    q: '파일 분석과 클립보드 분석의 차이는?',
    a: '파일 분석은 카톡에서 내보낸 전체 대화를 통째로 분석해서 감정/관심도/조언/답장 추천을 모두 받아볼 수 있어요. 클립보드/말풍선은 짧은 단문 위주로 즉석 조언에 초점을 둡니다.',
  },
  {
    q: '대화가 외부로 전송되나요?',
    a: '아니요. 모든 분석은 사용자 기기 안에서만 이루어지며, 데이터가 외부 서버로 전송되지 않습니다.',
  },
  {
    q: '감정분석과 업무분석은 어떻게 다른가요?',
    a: '감정분석은 상대방의 감정/관심도/답장 추천에 초점, 업무분석은 내용요약/일정/액션아이템/리스크에 초점을 둡니다. 같은 대화를 두 모드로 모두 분석할 수 있어요.',
  },
  {
    q: '구독은 어떻게 취소하나요?',
    a: 'iOS는 설정 → Apple ID → 구독, Android는 Play 스토어 → 구독 관리에서 취소할 수 있습니다.',
  },
];

function HowToScreen({ onBack, onNavigate }) {
  const [step, setStep] = useState(0);
  const { isTablet, contentMaxWidth, horizontalPad } = useResponsiveLayout();

  const method = METHODS[step];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={onBack}
          style={styles.backButton}
          textColor={colors.textPrimary}
        >
          뒤로
        </Button>
        <Text style={styles.headerTitle}>사용법</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 프로그레스 */}
      <View style={[styles.progressContainer, { paddingHorizontal: horizontalPad }]}>
        <ProgressBar
          progress={(step + 1) / METHODS.length}
          color={method.color}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          {step + 1} / {METHODS.length}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingHorizontal: horizontalPad, paddingBottom: spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 메인 안내 */}
        <Card style={[styles.heroCard, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          <Card.Content style={styles.heroContent}>
            <View style={[styles.iconContainer, { backgroundColor: method.soft }]}>
              <Text style={styles.methodEmoji}>{method.emoji}</Text>
            </View>
            <Text style={[styles.methodLabel, { color: method.color }]}>
              방법 {step + 1}
            </Text>
            <Text style={styles.methodTitle}>{method.title}</Text>
            <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
            <View style={[styles.whenPill, { backgroundColor: method.soft }]}>
              <Text style={[styles.whenText, { color: method.color }]}>
                언제 쓰면 좋을까? · {method.when}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* 단계별 설명 */}
        <Card style={[styles.stepsCard, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          <Card.Content>
            <Text style={styles.stepsTitle}>진행 순서</Text>
            {method.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: method.color }]}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* 네비게이션 */}
        <View style={[styles.navigation, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          <Button
            mode="outlined"
            onPress={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={styles.navButton}
            textColor={colors.textSecondary}
          >
            ← 이전
          </Button>

          {step < METHODS.length - 1 ? (
            <Button
              mode="contained"
              onPress={() => setStep(Math.min(METHODS.length - 1, step + 1))}
              style={styles.navButton}
              buttonColor={method.color}
            >
              다음 방법 →
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => onNavigate('subscription')}
              style={styles.navButton}
              buttonColor={colors.accent}
            >
              프리미엄 보기
            </Button>
          )}
        </View>

        {/* 점 인디케이터 */}
        <View style={styles.dots}>
          {METHODS.map((m, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === step && { backgroundColor: m.color, width: 24 },
              ]}
            />
          ))}
        </View>

        {/* 팁 */}
        <Card style={[styles.tipsCard, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          <Card.Content>
            <Text style={styles.tipsTitle}>💡 알아두면 좋아요</Text>
            {TIPS.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* FAQ */}
        <Card style={[styles.faqCard, contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          <Card.Content>
            <Text style={styles.faqTitle}>❓ 자주 묻는 질문</Text>
            {FAQS.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={f.a} />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

function FaqItem({ question, answer }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.faqItem}>
      <Button
        mode="text"
        onPress={() => setExpanded(!expanded)}
        contentStyle={styles.faqButtonContent}
        labelStyle={styles.faqButtonLabel}
        icon={expanded ? 'chevron-up' : 'chevron-down'}
      >
        {question}
      </Button>
      {expanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{answer}</Text>
        </View>
      )}
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 64,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginLeft: spacing.md,
    fontWeight: typography.weight.semibold,
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.lg,
  },

  heroCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  methodEmoji: {
    fontSize: 40,
  },
  methodLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  methodSubtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.size.base,
    marginBottom: spacing.md,
  },
  whenPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: 'stretch',
  },
  whenText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.size.sm,
  },

  stepsCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  stepsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.textInverse,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  stepText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.base,
  },

  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  navButton: {
    flex: 1,
    borderRadius: radius.md,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: 4,
  },

  tipsCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.lg,
    ...shadow.none,
  },
  tipsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tipEmoji: {
    fontSize: typography.size.base,
    marginRight: spacing.sm,
  },
  tipText: {
    flexSize: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.sm,
  },

  faqCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  faqTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqButtonContent: {
    justifyContent: 'flex-start',
  },
  faqButtonLabel: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
    textAlign: 'left',
  },
  faqAnswer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  faqAnswerText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.size.sm,
  },
});

export default HowToScreen;
