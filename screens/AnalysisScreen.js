/**
 * 분석 결과 스크린
 *
 * AI 분석 결과를 보여주고 추천 답장을 제공
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, IconButton, Button, Chip, Divider } from 'react-native-paper';

// 컴포넌트
import EmotionCard from '../components/EmotionCard';
import InterestCard from '../components/InterestCard';
import ReplySuggestions from '../components/ReplySuggestions';
import AdviceCard from '../components/AdviceCard';

// AI 분석
import { createAnalyzer } from '../ai-engine/analyzer';

function AnalysisScreen({ onNavigate, onBack, route }) {
  const { chatData, analysisText, isRecent } = route?.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('summary');

  // ===== AI 분석 실행 =====
  useEffect(() => {
    if (!analysisText) {
      setError('분석할 대화가 없습니다.');
      setIsLoading(false);
      return;
    }

    const runAnalysis = async () => {
      try {
        // 분석기 생성
        const analyzer = createAnalyzer({ useOnDevice: true });
        analyzer.setConversation(analysisText);

        // 분석 실행
        const result = await analyzer.analyze({
          types: ['emotion', 'interest', 'advice', 'replies'],
        });

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
    };

    runAnalysis();
  }, [analysisText]);

  // ===== 탭 렌더링 =====
  const renderTab = () => {
    switch (selectedTab) {
      case 'summary':
        return <SummaryTab result={analysisResult} />;
      case 'emotion':
        return <EmotionTab result={analysisResult?.emotion} />;
      case 'interest':
        return <InterestTab result={analysisResult?.interest} />;
      case 'replies':
        return <RepliesTab result={analysisResult?.replies} />;
      case 'advice':
        return <AdviceTab result={analysisResult?.advice} />;
      default:
        return <SummaryTab result={analysisResult} />;
    }
  };

  // ===== 로딩 상태 =====
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>AI가 대화를 분석 중입니다...</Text>
        <Text style={styles.loadingSubtext}>
          잠시만 기다려주세요
        </Text>
      </View>
    );
  }

  // ===== 에러 상태 =====
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="alert-circle" size={64} iconColor="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={onBack}>
          다시 시도
        </Button>
      </View>
    );
  }

  // ===== 결과 화면 =====
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={onBack} />
        <Text style={styles.headerTitle}>분석 결과</Text>
        <IconButton icon="share-variant" onPress={() => {}} />
      </View>

      {/* 탭 네비게이션 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {[
          { key: 'summary', label: '요약', icon: 'text-summary' },
          { key: 'emotion', label: '감정', icon: 'emoticon' },
          { key: 'interest', label: '관심도', icon: 'heart' },
          { key: 'replies', label: '답장', icon: 'message-reply' },
          { key: 'advice', label: '조언', icon: 'lightbulb' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <IconButton
              icon={tab.icon}
              size={18}
              iconColor={
                selectedTab === tab.key ? '#6366F1' : '#6B7280'
              }
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 탭 콘텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTab()}
      </ScrollView>

      {/* 프리미엄 업셀링 (하단) */}
      {!isRecent && (
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumText}>더 자세한 분석을 원하시나요?</Text>
          <Button
            mode="contained"
            compact
            onPress={() => onNavigate('subscription')}
          >
            프리미엄 업그레이드
          </Button>
        </View>
      )}
    </View>
  );
}

// ===== 요약 탭 =====
function SummaryTab({ result }) {
  const comprehensive = result?.comprehensive || result?.interest;

  if (!comprehensive) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>분석 요약</Text>
          <Text style={styles.placeholder}>
            요약 데이터를 불러오는 중입니다...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View>
      {/* 감정 요약 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>💭 감정 분석</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.emoji}>
              {comprehensive.emotion?.emoji || '😊'}
            </Text>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryValue}>
                {comprehensive.emotion?.overall || '중립적'}
              </Text>
              <Text style={styles.summaryDescription}>
                {comprehensive.emotion?.description || ''}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 관심도 요약 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>❤️ 관심도</Text>
          <View style={styles.summaryRow}>
            <Chip
              icon="heart"
              style={styles.interestChip}
              textStyle={styles.interestChipText}
            >
              {comprehensive.interest?.level || '보통'}{' '}
              ({comprehensive.interest?.score || 5}/10)
            </Chip>
          </View>
          {comprehensive.interest?.evidence && (
            <View style={styles.evidenceList}>
              {comprehensive.interest.evidence.slice(0, 2).map((e, i) => (
                <Text key={i} style={styles.evidenceText}>
                  • {e}
                </Text>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 조언 요약 */}
      {comprehensive.analysis && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>💡 조언</Text>
            {comprehensive.analysis.good_points?.length > 0 && (
              <View style={styles.tipSection}>
                <Text style={styles.tipLabel}>👍 좋았던 점</Text>
                {comprehensive.analysis.good_points.map((p, i) => (
                  <Text key={i} style={styles.tipText}>
                    • {p}
                  </Text>
                ))}
              </View>
            )}
            {comprehensive.analysis.my_mistakes?.length > 0 && (
              <View style={styles.tipSection}>
                <Text style={styles.tipLabel}>⚠️ 개선할 점</Text>
                {comprehensive.analysis.my_mistakes.map((m, i) => (
                  <Text key={i} style={styles.tipText}>
                    • {m}
                  </Text>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

// ===== 감정 탭 =====
function EmotionTab({ result }) {
  return <EmotionCard data={result} />;
}

// ===== 관심도 탭 =====
function InterestTab({ result }) {
  return <InterestCard data={result} />;
}

// ===== 답장 탭 =====
function RepliesTab({ result }) {
  return <ReplySuggestions data={result} />;
}

// ===== 조언 탭 =====
function AdviceTab({ result }) {
  return <AdviceCard data={result} />;
}

// ===== 스타일 =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#111827',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
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
    paddingVertical: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  summaryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  interestChip: {
    backgroundColor: '#FEE2E2',
  },
  interestChipText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  evidenceList: {
    marginTop: 12,
  },
  evidenceText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  tipSection: {
    marginBottom: 12,
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  premiumText: {
    fontSize: 14,
    color: '#6366F1',
    flex: 1,
  },
});

export default AnalysisScreen;
