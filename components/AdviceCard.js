/**
 * 조언 카드
 *
 * 관계 개선을 위한 조언을 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, IconButton } from 'react-native-paper';

function AdviceCard({ data }) {
  if (!data) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>조언을 불러오는 중...</Text>
        </Card.Content>
      </Card>
    );
  }

  const { analysis, advice, good_points, my_mistakes, recommendations } = data;

  return (
    <View>
      {/* 요약 조언 */}
      {advice && (
        <Card style={[styles.card, styles.adviceCard]}>
          <Card.Content>
            <View style={styles.adviceHeader}>
              <Text style={styles.adviceEmoji}>💡</Text>
              <Text style={styles.adviceTitle}>핵심 조언</Text>
            </View>
            <Text style={styles.adviceText}>{advice}</Text>
          </Card.Content>
        </Card>
      )}

      {/* 좋았던 점 */}
      {good_points && good_points.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>👍</Text>
              <Text style={styles.sectionTitle}>잘하고 있는 부분</Text>
            </View>
            {good_points.map((point, index) => (
              <View key={index} style={styles.pointItem}>
                <IconButton icon="check-circle" size={18} iconColor="#10B981" />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 개선할 점 */}
      {my_mistakes && my_mistakes.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>⚠️</Text>
              <Text style={styles.sectionTitle}>개선할 부분</Text>
            </View>
            {my_mistakes.map((mistake, index) => (
              <View key={index} style={styles.mistakeItem}>
                <IconButton icon="alert-circle" size={18} iconColor="#F59E0B" />
                <View style={styles.mistakeContent}>
                  <Text style={styles.mistakeText}>{mistake}</Text>
                  {my_mistakes.suggestions?.[index] && (
                    <Text style={styles.suggestionText}>
                      💡 {my_mistakes.suggestions[index]}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 상세 분석 */}
      {analysis && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>상세 분석</Text>

            {analysis.communication_style && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisLabel}>💬 소통 스타일</Text>
                <Text style={styles.analysisText}>
                  {analysis.communication_style}
                </Text>
              </View>
            )}

            {analysis.relationship_stage && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisLabel}>🎯 관계 단계</Text>
                <View style={styles.stageIndicator}>
                  {['인사', '친해지기', '호감', '교제'].map((stage, i) => {
                    const currentIndex = ['인사', '친해지기', '호감', '교제'].indexOf(
                      analysis.relationship_stage
                    );
                    const isActive = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <View key={i} style={styles.stageItem}>
                        <View
                          style={[
                            styles.stageDot,
                            isActive && styles.stageDotActive,
                            isCurrent && styles.stageDotCurrent,
                          ]}
                        />
                        <Text
                          style={[
                            styles.stageLabel,
                            isActive && styles.stageLabelActive,
                          ]}
                        >
                          {stage}
                        </Text>
                        {i < 3 && (
                          <View
                            style={[
                              styles.stageLine,
                              isActive && styles.stageLineActive,
                            ]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {analysis.tone && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisLabel}>🎨 말투 분석</Text>
                <View style={styles.toneList}>
                  {analysis.tone.positive && analysis.tone.positive.map((t, i) => (
                    <View key={`pos-${i}`} style={styles.toneItem}>
                      <Text style={styles.toneEmoji}>✨</Text>
                      <Text style={styles.toneText}>{t}</Text>
                    </View>
                  ))}
                  {analysis.tone.negative && analysis.tone.negative.map((t, i) => (
                    <View key={`neg-${i}`} style={styles.toneItem}>
                      <Text style={styles.toneEmoji}>⚡</Text>
                      <Text style={styles.toneText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* 추천 행동 */}
      {recommendations && recommendations.length > 0 && (
        <Card style={[styles.card, styles.recommendCard]}>
          <Card.Content>
            <Text style={styles.cardTitle}>📋 다음에 추천하는 행동</Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recItem}>
                <View style={styles.recNumber}>
                  <Text style={styles.recNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.recContent}>
                  <Text style={styles.recText}>{rec.action}</Text>
                  {rec.reason && (
                    <Text style={styles.recReason}>{rec.reason}</Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </View>
  );
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

  // ===== 조언 =====
  adviceCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  adviceText: {
    fontSize: 15,
    color: '#78350F',
    lineHeight: 24,
  },

  // ===== 좋았던 점 =====
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pointText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },

  // ===== 개선할 점 =====
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mistakeContent: {
    flex: 1,
  },
  mistakeText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  suggestionText: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // ===== 분석 =====
  analysisSection: {
    marginBottom: 16,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  analysisText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  stageDotActive: {
    backgroundColor: '#6366F1',
  },
  stageDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#C7D2FE',
  },
  stageLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  stageLabelActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  stageLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 2,
  },
  stageLineActive: {
    backgroundColor: '#6366F1',
  },
  toneList: {},
  toneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  toneEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  toneText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },

  // ===== 추천 행동 =====
  recommendCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recContent: {
    flex: 1,
  },
  recText: {
    fontSize: 14,
    color: '#3730A3',
    lineHeight: 22,
  },
  recReason: {
    fontSize: 13,
    color: '#6366F1',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default AdviceCard;
