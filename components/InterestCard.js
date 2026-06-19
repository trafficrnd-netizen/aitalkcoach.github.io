/**
 * 관심도 카드
 *
 * 상대방의 관심 수준을 분석하여 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';

function InterestCard({ data }) {
  if (!data) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>관심도 데이터를 불러오는 중...</Text>
        </Card.Content>
      </Card>
    );
  }

  const { level, score, evidence, indicators } = data;

  return (
    <View>
      {/* 전체 관심도 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.emoji}>{getLevelEmoji(level)}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.levelLabel}>상대방의 관심 수준</Text>
              <Text style={styles.levelValue}>{level}</Text>
              <Text style={styles.scoreValue}>{score}/10</Text>
            </View>
          </View>

          {/* 점수 바 */}
          <View style={styles.scoreBar}>
            <ProgressBar
              progress={score / 10}
              color={getLevelColor(level)}
              style={styles.progressBar}
            />
            <View style={styles.scoreLabels}>
              <Text style={styles.scoreLabel}>낮음</Text>
              <Text style={styles.scoreLabel}>보통</Text>
              <Text style={styles.scoreLabel}>높음</Text>
            </View>
          </View>

          {/* 해석 */}
          <View style={styles.interpretation}>
            <Text style={styles.interpretationText}>
              {getInterpretation(level)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 관심 지표 */}
      {indicators && indicators.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>관심 지표 분석</Text>
            {indicators.map((indicator, index) => (
              <View key={index} style={styles.indicatorItem}>
                <View style={styles.indicatorHeader}>
                  <Text style={styles.indicatorEmoji}>
                    {getIndicatorEmoji(indicator.type)}
                  </Text>
                  <Text style={styles.indicatorName}>{indicator.name}</Text>
                  <View style={[styles.indicatorDot, { backgroundColor: getIndicatorColor(indicator.value) }]} />
                </View>
                <ProgressBar
                  progress={indicator.value / 10}
                  color={getIndicatorColor(indicator.value)}
                  style={styles.indicatorBar}
                />
                <Text style={styles.indicatorNote}>{indicator.note}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 증거 */}
      {evidence && evidence.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>관심도가 높다는 근거</Text>
            {evidence.map((item, index) => (
              <View key={index} style={styles.evidenceItem}>
                <Text style={styles.evidenceBullet}>•</Text>
                <Text style={styles.evidenceText}>{item}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 조언 */}
      <Card style={[styles.card, styles.adviceCard]}>
        <Card.Content>
          <Text style={styles.cardTitle}>💡 다음 행동 조언</Text>
          <Text style={styles.adviceText}>{getAdvice(level)}</Text>
        </Card.Content>
      </Card>
    </View>
  );
}

// ===== 헬퍼 함수 =====
function getLevelEmoji(level) {
  const map = {
    '매우 높음': '🔥',
    '높음': '❤️',
    '보통': '🤔',
    '낮음': '🧊',
    '매우 낮음': '❄️',
  };
  return map[level] || '🤔';
}

function getLevelColor(level) {
  const map = {
    '매우 높음': '#EF4444',
    '높음': '#10B981',
    '보통': '#F59E0B',
    '낮음': '#6B7280',
    '매우 낮음': '#9CA3AF',
  };
  return map[level] || '#6366F1';
}

function getInterpretation(level) {
  const map = {
    '매우 높음': '상대방이 당신에게 매우 큰 관심을 보이고 있습니다. 이 기호를 잘 살려 관계를 발전시켜 보세요!',
    '높음': '상대방이 당신에게 긍정적인 관심을 보이고 있습니다. 긍정적인 신호를 보내고 있으니 자신있게 대화에 참여하세요.',
    '보통': '상대방의 관심이 보통 수준입니다. 대화를 더 의미있게 만들어 관심을 높여보세요.',
    '낮음': '상대방의 관심이 낮은 편입니다. 너무 부담가지지 말고 먼저 연락하는 빈도를 줄여보세요.',
    '매우 낮음': '상대방이 현재 큰 관심을 보이지 않고 있습니다. 다시 접근하기보다는 시간이 지나도 다을지 판단해보세요.',
  };
  return map[level] || '관심도를 분석 중입니다...';
}

function getIndicatorEmoji(type) {
  const map = {
    replySpeed: '⚡',
    messageLength: '📝',
    emoji: '😊',
    question: '❓',
    initiative: '🔥',
    response: '💬',
  };
  return map[type] || '📊';
}

function getIndicatorColor(value) {
  if (value >= 7) return '#10B981';
  if (value >= 4) return '#F59E0B';
  return '#EF4444';
}

function getAdvice(level) {
  const map = {
    '매우 높음': '상대방의 관심을 악용하지 말고 진심으로 대화에 임하세요. 너무 쉽게 굴지 말고 나란한 관계를 유지하세요.',
    '높음': '좋은 관계를 만들고 있으니 자연스럽게 대화를 이어가세요. 다음 만남을 자연스럽게 제안해보세요.',
    '보통': '대화의 질을 높여보세요. 서로에 대해 더 깊이 알고 싶어하는 질문을 하거나, 공통된 관심사를 찾아보세요.',
    '낮음': '상대방의 공간을 존중하면서도 가끔 연락해보세요. 부담 없는 메세지로 관심을 표현해보세요.',
    '매우 낮음': '지금 바로 해결책을 찾으려 하지 마세요. 시간이 해결해줄 수 있습니다.',
  };
  return map[level] || '조언을 준비 중입니다...';
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 56,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  levelValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  scoreValue: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  scoreBar: {
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  scoreLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  interpretation: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  interpretationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  indicatorItem: {
    marginBottom: 16,
  },
  indicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicatorEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  indicatorName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorBar: {
    height: 6,
    borderRadius: 3,
  },
  indicatorNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  evidenceBullet: {
    fontSize: 14,
    color: '#6366F1',
    marginRight: 8,
    fontWeight: 'bold',
  },
  evidenceText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  adviceCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  adviceText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 22,
  },
});

export default InterestCard;
