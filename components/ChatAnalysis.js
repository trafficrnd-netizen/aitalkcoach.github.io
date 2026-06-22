/**
 * 분석 결과 통합 뷰
 *
 * 여러 분석 결과를 한눈에 볼 수 있는 대시보드 스타일 카드
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, IconButton, Divider, ProgressBar } from 'react-native-paper';

// 서브 컴포넌트
import EmotionCard from './EmotionCard';
import InterestCard from './InterestCard';
import ReplySuggestions from './ReplySuggestions';
import AdviceCard from './AdviceCard';

function ChatAnalysis({ analysisResult, chatData, isPremium }) {
  const [expandedSection, setExpandedSection] = useState('summary');

  // 데이터 파싱
  const comprehensive = analysisResult?.comprehensive || {};
  const emotion = analysisResult?.emotion || comprehensive.emotion || {};
  const interest = analysisResult?.interest || comprehensive.interest || {};
  const advice = analysisResult?.advice || comprehensive.analysis || {};
  const replies = analysisResult?.replies || comprehensive.replies || {};

  // 요약 데이터
  const summaryData = {
    emotionLevel: emotion.overall || '분석 중',
    emotionScore: emotion.score || 5,
    interestLevel: interest.level || '분석 중',
    interestScore: interest.score || 5,
    messageCount: chatData?.messages?.length || 0,
    dayCount: chatData?.dayCount || 0,
    myMessageRatio: calculateMyRatio(chatData),
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 요약 헤더 */}
      <SummaryHeader data={summaryData} />

      {/* 빠른 인사이트 */}
      <QuickInsights data={summaryData} />

      {/* 탭 섹션 */}
      <SectionCard
        title="💭 감정 분석"
        icon="emoticon-outline"
        expanded={expandedSection === 'emotion'}
        onToggle={() => setExpandedSection(expandedSection === 'emotion' ? null : 'emotion')}
        badge={emotion.overall}
      >
        <EmotionCard data={emotion} />
      </SectionCard>

      <SectionCard
        title="❤️ 관심도 분석"
        icon="heart-outline"
        expanded={expandedSection === 'interest'}
        onToggle={() => setExpandedSection(expandedSection === 'interest' ? null : 'interest')}
        badge={interest.level}
      >
        <InterestCard data={interest} />
      </SectionCard>

      <SectionCard
        title="💡 조언"
        icon="lightbulb-outline"
        expanded={expandedSection === 'advice'}
        onToggle={() => setExpandedSection(expandedSection === 'advice' ? null : 'advice')}
        badge={advice.advice ? 'NEW' : null}
      >
        <AdviceCard data={advice} />
      </SectionCard>

      <SectionCard
        title="📝 답장 추천"
        icon="message-reply-outline"
        expanded={expandedSection === 'replies'}
        onToggle={() => setExpandedSection(expandedSection === 'replies' ? null : 'replies')}
        badge={!isPremium ? 'PRO' : null}
      >
        {!isPremium ? (
          <PremiumOverlay message="답장 추천은 프리미엄 전용 기능입니다." />
        ) : (
          <ReplySuggestions data={replies} />
        )}
      </SectionCard>

      {/* 프리미엄 업셀링 */}
      {!isPremium && (
        <PremiumUpgradeBanner />
      )}
    </ScrollView>
  );
}

// ===== 서브 컴포넌트 =====

function SummaryHeader({ data }) {
  const emotionColor = data.emotionScore >= 6 ? '#10B981' : data.emotionScore >= 4 ? '#F59E0B' : '#EF4444';
  const interestColor = data.interestScore >= 6 ? '#10B981' : data.interestScore >= 4 ? '#F59E0B' : '#EF4444';

  return (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <Text style={styles.summaryTitle}>📊 대화 분석 요약</Text>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.messageCount}</Text>
            <Text style={styles.statLabel}>메시지</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.dayCount || '?'}</Text>
            <Text style={styles.statLabel}>일</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.myMessageRatio}%</Text>
            <Text style={styles.statLabel}>내가 보낸</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* 감정 + 관심도 빠르게 */}
        <View style={styles.quickScores}>
          <View style={styles.quickScoreItem}>
            <Text style={styles.quickScoreLabel}>감정 온도</Text>
            <View style={styles.quickScoreBar}>
              <ProgressBar
                progress={data.emotionScore / 10}
                color={emotionColor}
                style={styles.quickBar}
              />
            </View>
            <Text style={[styles.quickScoreValue, { color: emotionColor }]}>
              {data.emotionScore}/10
            </Text>
          </View>

          <View style={styles.quickScoreItem}>
            <Text style={styles.quickScoreLabel}>관심도</Text>
            <View style={styles.quickScoreBar}>
              <ProgressBar
                progress={data.interestScore / 10}
                color={interestColor}
                style={styles.quickBar}
              />
            </View>
            <Text style={[styles.quickScoreValue, { color: interestColor }]}>
              {data.interestScore}/10
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

function QuickInsights({ data }) {
  const insights = generateInsights(data);

  if (insights.length === 0) return null;

  return (
    <Card style={styles.insightsCard}>
      <Card.Content>
        <Text style={styles.insightsTitle}>🔍 주요 포인트</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

function SectionCard({ title, icon, expanded, onToggle, badge, children }) {
  return (
    <Card style={[styles.sectionCard, expanded && styles.sectionCardExpanded]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <Card.Content style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <IconButton
              icon={icon}
              size={20}
              iconColor="#6366F1"
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>{title}</Text>
            {badge && (
              <View style={[styles.badge, badge === 'PRO' && styles.badgePro]}>
                <Text style={[styles.badgeText, badge === 'PRO' && styles.badgeTextPro]}>
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            iconColor="#9CA3AF"
          />
        </Card.Content>
      </TouchableOpacity>

      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </Card>
  );
}

function PremiumOverlay({ message }) {
  return (
    <View style={styles.premiumOverlay}>
      <Text style={styles.premiumOverlayIcon}>🔒</Text>
      <Text style={styles.premiumOverlayText}>{message}</Text>
    </View>
  );
}

function PremiumUpgradeBanner() {
  return (
    <Card style={styles.upgradeBanner}>
      <Card.Content style={styles.upgradeContent}>
        <Text style={styles.upgradeEmoji}>👑</Text>
        <View style={styles.upgradeText}>
          <Text style={styles.upgradeTitle}>모든 기능 잠금해제</Text>
          <Text style={styles.upgradeSubtitle}>프리미엄 구독으로 무제한 분석</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

// ===== 헬퍼 함수 =====

function calculateMyRatio(chatData) {
  if (!chatData?.messages?.length) return 0;
  const myMessages = chatData.messages.filter((m) => m.isMe).length;
  return Math.round((myMessages / chatData.messages.length) * 100);
}

function generateInsights(data) {
  const insights = [];

  if (data.myMessageRatio > 70) {
    insights.push({
      icon: '💬',
      text: '내가 너무 많이 연락하고 있어요. 살짝 간격을 벌어보세요.',
    });
  } else if (data.myMessageRatio < 30) {
    insights.push({
      icon: '💬',
      text: '상대방이 먼저 연락하는 편이에요. 좋은 신호일 수 있어요!',
    });
  }

  if (data.emotionScore >= 7) {
    insights.push({
      icon: '😊',
      text: '전체적인 대화 분위기가 매우 긍정적입니다.',
    });
  } else if (data.emotionScore <= 3) {
    insights.push({
      icon: '😟',
      text: '대화 분위기가 다소 차가울 수 있어요. 신중하게 접근하세요.',
    });
  }

  if (data.interestScore >= 7) {
    insights.push({
      icon: '🔥',
      text: '상대방이 높은 관심을 보이고 있어요!',
    });
  }

  return insights;
}

// ===== 스타일 =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  divider: {
    marginVertical: 12,
  },
  quickScores: {
    gap: 12,
  },
  quickScoreItem: {
    marginBottom: 8,
  },
  quickScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  quickScoreBar: {
    flex: 1,
  },
  quickBar: {
    height: 8,
    borderRadius: 4,
  },
  quickScoreValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'right',
  },
  insightsCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  insightsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  insightText: {
    fontSize: 13,
    color: '#15803D',
    flex: 1,
    lineHeight: 20,
  },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sectionCardExpanded: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    margin: 0,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgePro: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badgeTextPro: {
    color: '#FFFFFF',
  },
  sectionContent: {
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  premiumOverlay: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  premiumOverlayIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  premiumOverlayText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  upgradeBanner: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});

export default ChatAnalysis;
