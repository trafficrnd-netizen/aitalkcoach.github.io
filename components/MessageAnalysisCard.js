/**
 * 메시지별 분석 카드
 *
 * 각 메시지에 대해:
 * - 보낸 사람 (나 / 상대방)
 * - 원본 메시지
 * - 감정 점수
 * - 감지된 시그널 (질문, 만남제안, 호감, 배려 등)
 * - AI 코멘트
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';

function MessageAnalysisCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>메시지별 분석을 불러오는 중...</Text>
        </Card.Content>
      </Card>
    );
  }

  // 메타 정보
  const myCount = data.filter((m) => m.isFromMe).length;
  const otherCount = data.length - myCount;

  // 통계
  const avgMyEmotion = data.filter((m) => m.isFromMe)
    .reduce((a, m) => a + (m.emotion || 5), 0) / Math.max(myCount, 1);
  const avgOtherEmotion = data.filter((m) => !m.isFromMe)
    .reduce((a, m) => a + (m.emotion || 5), 0) / Math.max(otherCount, 1);

  return (
    <View>
      {/* 헤더 통계 */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>📋 메시지별 분석</Text>
          <Text style={styles.statsSubtitle}>
            전체 {data.length}개 메시지 · 내 메시지 {myCount}개 · 상대방 {otherCount}개
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>내 평균 감정</Text>
              <Text style={[styles.statValue, { color: getEmotionColor(avgMyEmotion) }]}>
                {avgMyEmotion.toFixed(1)}/10
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>상대방 평균 감정</Text>
              <Text style={[styles.statValue, { color: getEmotionColor(avgOtherEmotion) }]}>
                {avgOtherEmotion.toFixed(1)}/10
              </Text>
            </View>
          </View>
          <Text style={styles.legend}>
            💡 각 메시지에 직접적인 코멘트가 표시됩니다
          </Text>
        </Card.Content>
      </Card>

      {/* 메시지 리스트 */}
      {data.map((msg, idx) => (
        <MessageItem key={idx} msg={msg} />
      ))}
    </View>
  );
}

function MessageItem({ msg }) {
  const { isFromMe, sender, content, emotion, signals, comment, emoji } = msg;
  const emotionColor = getEmotionColor(emotion);

  return (
    <Card style={[styles.messageCard, isFromMe ? styles.messageCardMe : styles.messageCardOther]}>
      <Card.Content style={styles.messageContent}>
        {/* 보낸 사람 헤더 */}
        <View style={styles.messageHeader}>
          <View style={styles.senderRow}>
            <View
              style={[
                styles.senderAvatar,
                { backgroundColor: isFromMe ? '#6366F1' : '#EC4899' },
              ]}
            >
              <Text style={styles.senderAvatarText}>
                {(isFromMe ? '나' : sender || '?').slice(0, 1)}
              </Text>
            </View>
            <Text style={styles.senderName}>
              {isFromMe ? '나' : sender || '상대방'}
            </Text>
            {emoji && <Text style={styles.msgEmoji}>{emoji}</Text>}
          </View>
          <View style={[styles.emotionBadge, { backgroundColor: emotionColor + '20' }]}>
            <Text style={[styles.emotionScore, { color: emotionColor }]}>
              {emotion?.toFixed?.(1) || emotion}/10
            </Text>
          </View>
        </View>

        {/* 메시지 원문 */}
        <View
          style={[
            styles.bubble,
            isFromMe ? styles.bubbleMe : styles.bubbleOther,
          ]}
        >
          <Text style={[styles.bubbleText, isFromMe && styles.bubbleTextMe]}>
            {content}
          </Text>
        </View>

        {/* 시그널 칩들 */}
        {signals && signals.length > 0 && (
          <View style={styles.signalsRow}>
            {signals.map((s, i) => (
              <View key={i} style={styles.signalChip}>
                <Text style={styles.signalChipText}>{getSignalLabel(s)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 코멘트 */}
        <View style={styles.commentBox}>
          <Text style={styles.commentIcon}>💬</Text>
          <Text style={styles.commentText}>{comment}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

function getEmotionColor(score) {
  if (score >= 7) return '#10B981';
  if (score >= 5) return '#F59E0B';
  if (score >= 3) return '#EF4444';
  return '#6B7280';
}

function getSignalLabel(signal) {
  const map = {
    question: '❓ 질문',
    meetup: '🤝 만남',
    short_reply: '⚡ 짧음',
    affection: '💕 호감',
    care: '🤗 배려',
  };
  return map[signal] || signal;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // 통계 카드
  statsCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  legend: {
    fontSize: 11,
    color: '#6366F1',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // 메시지 카드
  messageCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  messageCardMe: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  messageCardOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageContent: {
    paddingVertical: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  senderAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  msgEmoji: {
    fontSize: 16,
    marginLeft: 6,
  },
  emotionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emotionScore: {
    fontSize: 11,
    fontWeight: '600',
  },

  // 버블
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleMe: {
    backgroundColor: '#6366F1',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  bubbleOther: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  bubbleText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#FFFFFF',
  },

  // 시그널
  signalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  signalChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  signalChipText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },

  // 코멘트
  commentBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commentIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  commentText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
});

export default MessageAnalysisCard;
