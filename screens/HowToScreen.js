/**
 * 사용법 화면
 *
 * 앱 사용 방법을 단계별로 안내
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  ProgressBar,
} from 'react-native-paper';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    id: 1,
    emoji: '📱',
    title: '카카오톡 대화 내보내기',
    description:
      '카카오톡에서 분석하고 싶은 대화방을 열고\n설정 → 대화 → 대화 내보내기를 선택하세요.',
    detail:
      '파일 형식은 "텍스트"로 선택해주세요.',
    iconBg: '#EEF2FF',
  },
  {
    id: 2,
    emoji: '📤',
    title: '파일 선택하기',
    description:
      'AI톡 코치 앱에서 "파일 선택하기" 버튼을 탭하고,\n내보낸 텍스트 파일을 선택하세요.',
    detail:
      '파일이 제대로 선택되면 파일 이름과 크기가 표시됩니다.',
    iconBg: '#F0FDF4',
  },
  {
    id: 3,
    emoji: '🤖',
    title: 'AI 분석 시작',
    description:
      '"AI 분석 시작" 버튼을 탭하면\n대화가 AI에 의해 분석됩니다.',
    detail:
      '분석에는 수 초~수십 초가 소요됩니다.\n대화의 길이에 따라 시간이 달라집니다.',
    iconBg: '#FEF3C7',
  },
  {
    id: 4,
    emoji: '💡',
    title: '결과 확인하기',
    description:
      '감정 분석, 관심도, 조언을 확인하고\n상황에 맞는 답장을 추천받아보세요.',
    detail:
      '📊 감정: 대화의 전체적인 분위기\n❤️ 관심도: 상대방의 관심 수준\n💬 답장: 상황별 추천 답장',
    iconBg: '#FFF1F2',
  },
  {
    id: 5,
    emoji: '👑',
    title: '프리미엄으로 업그레이드',
    description:
      '하루 3회 무료 분석 후,\n프리미엄으로 무제한 분석을 이용해보세요.',
    detail:
      '• 무제한 대화 분석\n• 상세 감정 분석\n• 맞춤 답장 추천\n• 대화 요약 기능',
    iconBg: '#F5F3FF',
  },
];

const TIPS = [
  {
    emoji: '✅',
    text: '카카오톡 내보내기는Wifi 환경에서 하는 것을 추천합니다 (대화 길이에 따라 파일 크기가 클 수 있습니다)',
  },
  {
    emoji: '✅',
    text: '분석은 100% 기기 내에서 이루어지며, 데이터가 외부로 전송되지 않습니다',
  },
  {
    emoji: '✅',
    text: '분석이 끝난 파일은 자동으로 삭제되지 않습니다. 설정에서 수동 삭제할 수 있습니다',
  },
  {
    emoji: '✅',
    text: '대화가 길수록 분석 시간이 길어지고, 더 정확한 결과를 얻을 수 있습니다',
  },
  {
    emoji: '⚠️',
    text: '일상적인 친구 대화보다, 관심을 표현하려는 데이트 대화에서 더 정확한 분석이 가능합니다',
  },
];

function HowToScreen({ onBack, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = STEPS[currentStep];
  const progress = (currentStep + 1) / STEPS.length;

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
        <Text style={styles.headerTitle}>사용법</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 프로그레스 */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          color="#6366F1"
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          {currentStep + 1} / {STEPS.length}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 단계 카드 */}
        <Card style={styles.stepCard}>
          <Card.Content style={styles.stepContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: step.iconBg },
              ]}
            >
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
            </View>

            <Text style={styles.stepNumber}>STEP {step.id}</Text>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>

            {step.detail && (
              <View style={styles.detailBox}>
                <Text style={styles.detailText}>{step.detail}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 네비게이션 버튼 */}
        <View style={styles.navigation}>
          <Button
            mode="outlined"
            onPress={goPrev}
            disabled={currentStep === 0}
            style={styles.navButton}
          >
            이전
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              mode="contained"
              onPress={goNext}
              style={styles.navButton}
            >
              다음
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => {
                onBack();
                onNavigate('subscription');
              }}
              style={[styles.navButton, styles.upgradeButton]}
              buttonColor="#6366F1"
            >
              프리미엄 체험하기
            </Button>
          )}
        </View>

        {/* 점 인디케이터 */}
        <View style={styles.dots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* 팁 섹션 */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text style={styles.tipsTitle}>💡 팁</Text>
            {TIPS.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* FAQ */}
        <Card style={styles.faqCard}>
          <Card.Content>
            <Text style={styles.faqTitle}>❓ 자주 묻는 질문</Text>

            <FaqItem
              question="어떤 카카오톡 파일을 지원하나요?"
              answer="카카오톡 내보내기 → 파일 형식 '텍스트'로 저장한 .txt 파일을 지원합니다."
            />
            <FaqItem
              question="대화가 외부로 전송되나요?"
              answer="아니요. 모든 분석은 사용자 기기 내에서만 이루어지며, 데이터가 외부로 전송되지 않습니다."
            />
            <FaqItem
              question="어떤 언어를 지원하나요?"
              answer="현재 한국어 대화에 최적화되어 있습니다. 다른 언어의 분석은 지원하지 않습니다."
            />
            <FaqItem
              question="분석 횟수가 제한되어 있나요?"
              answer="무료 사용자는 하루 3회 분석이 가능합니다. 프리미엄 구독 시 무제한으로 분석할 수 있습니다."
            />
            <FaqItem
              question="구독은 어떻게 취소하나요?"
              answer="iOS는 설정 → Apple ID → 구독, Android는 Play 스토어 → 구독 관리에서 취소할 수 있습니다."
            />
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  stepCard: {
    borderRadius: 20,
    marginBottom: 16,
  },
  stepContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepEmoji: {
    fontSize: 40,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  detailBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  upgradeButton: {
    backgroundColor: '#6366F1',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#6366F1',
    width: 24,
  },
  tipsCard: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipEmoji: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#15803D',
    flex: 1,
    lineHeight: 20,
  },
  faqCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqButtonContent: {
    justifyContent: 'flex-start',
  },
  faqButtonLabel: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'left',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default HowToScreen;
