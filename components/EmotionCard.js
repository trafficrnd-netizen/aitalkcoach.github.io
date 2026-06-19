/**
 * 감정 카드
 *
 * 대화의 감정 상태를 시각적으로 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, ProgressBar, Chip } from 'react-native-paper';

function EmotionCard({ data }) {
  if (!data) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>감정 데이터를 불러오는 중...</Text>
        </Card.Content>
      </Card>
    );
  }

  const { overall, score, description, timeline, breakdown } = data;

  return (
    <View>
      {/* 전체 감정 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.emoji}>{getEmoji(overall)}</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.overallLabel}>전체 감정</Text>
              <Text style={styles.overallValue}>{overall}</Text>
              <Text style={styles.overallScore}>{score}/10</Text>
            </View>
          </View>

          {description && (
            <Text style={styles.description}>{description}</Text>
          )}

          {/* 감정 점수 바 */}
          <View style={styles.scoreBar}>
            <ProgressBar
              progress={score / 10}
              color="#6366F1"
              style={styles.progressBar}
            />
            <View style={styles.scoreLabels}>
              <Text style={styles.scoreLabel}>부정적</Text>
              <Text style={styles.scoreLabel}>긍정적</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 감정 세분화 */}
      {breakdown && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>감정 세분화</Text>
            <View style={styles.breakdownGrid}>
              {Object.entries(breakdown).map(([key, value]) => (
                <View key={key} style={styles.breakdownItem}>
                  <Text style={styles.breakdownEmoji}>{getSmallEmoji(key)}</Text>
                  <Text style={styles.breakdownLabel}>{translateEmotion(key)}</Text>
                  <ProgressBar
                    progress={value / 10}
                    color={getEmotionColor(key)}
                    style={styles.breakdownBar}
                  />
                  <Text style={styles.breakdownValue}>{value}/10</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 감정 타임라인 */}
      {timeline && timeline.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>감정 변화</Text>
            <View style={styles.timeline}>
              {timeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineEmoji}>{getEmoji(item.emotion)}</Text>
                  </View>
                  {index < timeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineEmotion}>{item.emotion}</Text>
                    <Text style={styles.timelineTime}>{item.period}</Text>
                    {item.note && (
                      <Text style={styles.timelineNote}>{item.note}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 조언 */}
      {data.advice && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>💡 감정 관리 조언</Text>
            <Text style={styles.adviceText}>{data.advice}</Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

// ===== 헬퍼 함수 =====
function getEmoji(emotion) {
  const map = {
    '긍정적': '😊',
    '中性': '😐',
    '부정적': '😢',
    '설렘': '🥰',
    '기쁨': '😄',
    '슬픔': '😢',
    '분노': '😠',
    '불안': '😰',
    '평온': '😌',
  };
  return map[emotion] || '😐';
}

function getSmallEmoji(emotion) {
  const map = {
    happiness: '😊',
    sadness: '😢',
    anger: '😠',
    anxiety: '😰',
    excitement: '🤩',
    calm: '😌',
  };
  return map[emotion] || '😐';
}

function translateEmotion(emotion) {
  const map = {
    happiness: '행복',
    sadness: '슬픔',
    anger: '분노',
    anxiety: '불안',
    excitement: '설렘',
    calm: '평온',
  };
  return map[emotion] || emotion;
}

function getEmotionColor(emotion) {
  const map = {
    happiness: '#10B981',
    sadness: '#3B82F6',
    anger: '#EF4444',
    anxiety: '#F59E0B',
    excitement: '#EC4899',
    calm: '#6366F1',
  };
  return map[emotion] || '#6366F1';
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
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
    marginBottom: 12,
  },
  emoji: {
    fontSize: 56,
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  overallLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  overallValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  overallScore: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  scoreBar: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
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
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  breakdownItem: {
    width: '50%',
    marginBottom: 16,
    paddingRight: 8,
  },
  breakdownEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  breakdownBar: {
    height: 6,
    borderRadius: 3,
  },
  breakdownValue: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineEmoji: {
    fontSize: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 44,
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineEmotion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  adviceText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});

export default EmotionCard;
