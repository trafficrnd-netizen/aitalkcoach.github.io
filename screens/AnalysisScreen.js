/**
 * 분석 결과 스크린
 *
 * AI 분석 결과를 모드별로 보여주고 추천 답장 / 통합 조언을 제공.
 *
 * 모드:
 *  - emotion (감정분석): 요약 / 조언 / 감정 / 관심도 / 메시지 / 답장
 *  - work    (업무분석): 요약 / 내용요약 / 통합분석
 *  - quick   (빠른 조언): 한 카드에 즉석 조언만 (이 라우트는 보통 QuickAdviceScreen 사용)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { Card, IconButton, Button, Chip, Divider } from 'react-native-paper';

// 컴포넌트
import EmotionCard from '../components/EmotionCard';
import InterestCard from '../components/InterestCard';
import ReplySuggestions from '../components/ReplySuggestions';
import AdviceCard from '../components/AdviceCard';
import MessageAnalysisCard from '../components/MessageAnalysisCard';
import ModeSelector from '../components/ModeSelector';

// AI 분석
import { createAnalyzer } from '../ai-engine/analyzer';
import { useAppStore } from '../store/appStore';

// 디자인 토큰
import { colors, spacing, radius, shadow, typography, analysisMode as modeMeta } from '../app/theme';

// ===== 탭 정의 (모드별) =====
const TABS_BY_MODE = {
  emotion: [
    { key: 'summary', label: '요약', icon: '✨' },
    { key: 'advice', label: '조언', icon: '💡' },
    { key: 'emotion', label: '감정', icon: '💗' },
    { key: 'interest', label: '관심도', icon: '💞' },
    { key: 'messages', label: '메시지', icon: '💬' },
    { key: 'replies', label: '답장', icon: '✍️' },
  ],
  work: [
    { key: 'summary', label: '요약', icon: '✨' },
    { key: 'schedule', label: '일정요약', icon: '🗓️' },
    { key: 'integrated', label: '통합분석', icon: '🧩' },
  ],
  quick: [
    { key: 'summary', label: '조언', icon: '⚡' },
  ],
};

function AnalysisScreen({ onNavigate, onBack, route }) {
  const { text: paramText, analysisText: legacyText, chatId, chatName, isRecent } = route?.params || {};
  const isRecentFlag = isRecent === true || isRecent === 'true' || isRecent === '1';

  // store 에서 모드/텍스트/발신자/source 읽기
  const storeText = useAppStore((s) => s.currentAnalysisText);
  const storeSender = useAppStore((s) => s.currentAnalysisSender);
  const storeMode = useAppStore((s) => s.currentAnalysisMode);
  const storeSource = useAppStore((s) => s.currentAnalysisSource);
  const setAnalysisMode = useAppStore((s) => s.setAnalysisMode);

  // [NEW] 카톡 채팅방에서 텍스트 선택 후 들어왔는지 감지 → "채팅방으로" 버튼 노출
  const cameFromKakao = useMemo(() => {
    return typeof storeSource === 'string' && (
      storeSource.startsWith('kakao-') || storeSource === 'bubble'
    );
  }, [storeSource]);

  const handleBackToKakao = useCallback(async () => {
    try {
      // 1) kakaotalk:// 딥링크 시도 (가장 자연스러움 — 마지막 채팅방으로 복귀)
      const kakaoUrl = 'kakaotalk://';
      const supported = await Linking.canOpenURL(kakaoUrl);
      if (supported) {
        await Linking.openURL(kakaoUrl);
        return;
      }
      // 2) 실패 시 일반 카톡 패키지 실행
      await Linking.openURL('kakaotalk://launch');
    } catch (e) {
      // 3) 최후 fallback: 패키지 매니페스트로 실행
      try {
        await Linking.sendIntent('android.intent.action.MAIN', [
          { key: 'android.intent.category.LAUNCHER' },
        ]);
      } catch {
        Alert.alert('실패', '카톡으로 돌아가지 못했어요. 직접 앱을 열어주세요.');
      }
    }
  }, []);

  // 우선순위: route params text > store의 currentAnalysisText
  const analysisText = paramText || legacyText || storeText;

  // 채팅방 이름 (route params > store sender > chat name in currentChat)
  const currentChat = useAppStore((s) => s.currentChat);
  const chatNameDisplay = chatName || storeSender || currentChat?.name || null;

  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('summary');

  // 모드 바뀌면 첫 탭으로 리셋
  useEffect(() => {
    const firstTab = (TABS_BY_MODE[storeMode] || TABS_BY_MODE.emotion)[0]?.key || 'summary';
    setSelectedTab(firstTab);
  }, [storeMode]);

  // ===== AI 분석 실행 =====
  useEffect(() => {
    if (!analysisText || (typeof analysisText === 'string' && analysisText.trim().length === 0)) {
      setError('분석할 대화가 없습니다. 파일을 다시 선택하거나 카톡 알림 텍스트가 있는지 확인해주세요.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const runAnalysis = async () => {
      try {
        const analyzer = createAnalyzer({ useOnDevice: true });
        analyzer.setConversation(analysisText);

        // 모드별 분석 타입 결정
        const types =
          storeMode === 'work'
            ? ['work_summary', 'work_integrated', 'work_actions']
            : storeMode === 'quick'
            ? ['quick_advice']
            : ['emotion', 'interest', 'advice', 'replies'];

        const result = await analyzer.analyze({ types });

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
  }, [analysisText, storeMode]);

  const tabs = TABS_BY_MODE[storeMode] || TABS_BY_MODE.emotion;
  const currentModeMeta = modeMeta[storeMode] || modeMeta.emotion;

  // ===== 탭 렌더링 =====
  const renderTab = () => {
    switch (selectedTab) {
      case 'summary':
        return <SummaryTab result={analysisResult} mode={storeMode} />;
      case 'advice':
        return <AdviceTab result={analysisResult?.advice} />;
      case 'emotion':
        return <EmotionTab result={analysisResult?.emotion} />;
      case 'interest':
        return <InterestTab result={analysisResult?.interest} />;
      case 'messages':
        return <MessagesTab result={analysisResult?.messageAnalysis} />;
      case 'replies':
        return <RepliesTab result={analysisResult?.replies} />;
      case 'content':
        return <WorkContentTab result={analysisResult?.work_summary} />;
      case 'schedule':
        return <WorkScheduleTab result={analysisResult?.work_summary} />;
      case 'integrated':
        return <WorkIntegratedTab
          summary={analysisResult?.work_summary}
          integrated={analysisResult?.work_integrated}
          actions={analysisResult?.work_actions}
        />;
      default:
        return <SummaryTab result={analysisResult} mode={storeMode} />;
    }
  };

  // ===== 로딩 상태 =====
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBubble}>
          <Text style={styles.loadingEmoji}>{currentModeMeta.icon}</Text>
        </View>
        <ActivityIndicator size="large" color={currentModeMeta.color} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>
          {storeMode === 'work'
            ? '대화 내용을 정리하고 있어요'
            : storeMode === 'quick'
            ? '조언을 만들고 있어요'
            : '대화를 분석하고 있어요'}
        </Text>
        <Text style={styles.loadingSubtext}>잠시만 기다려주세요</Text>
      </View>
    );
  }

  // ===== 에러 상태 =====
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorBubble}>
          <Text style={styles.errorEmoji}>😥</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={onBack} buttonColor={colors.primary}>
          돌아가기
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== 헤더 ===== */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={onBack} iconColor={colors.textPrimary} size={22} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {currentModeMeta.icon} {currentModeMeta.label} 결과
          </Text>
          {chatNameDisplay && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              💬 {chatNameDisplay}
            </Text>
          )}
        </View>
        {cameFromKakao ? (
          <Pressable
            onPress={handleBackToKakao}
            style={({ pressed }) => [
              styles.backToKakaoBtn,
              pressed && { opacity: 0.6 },
            ]}
            android_ripple={{ color: colors.modeEmotionSoft, borderless: false }}
          >
            <Text style={styles.backToKakaoEmoji}>💬</Text>
            <Text style={styles.backToKakaoText}>채팅방</Text>
          </Pressable>
        ) : (
          <IconButton icon="share-variant" onPress={() => {}} iconColor={colors.textMuted} size={20} />
        )}
      </View>

      {/* ===== 모드 토글 (작은 pill) ===== */}
      <View style={styles.modeRow}>
        <ModeSelector
          value={storeMode}
          onChange={setAnalysisMode}
          options={['emotion', 'work']}
          compact
        />
      </View>

      {/* ===== 탭 네비게이션 (한 줄에 다 들어감) ===== */}
      <View style={styles.tabBar}>
        <View style={styles.tabBarInner}>
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedTab(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && { backgroundColor: currentModeMeta.soft },
                  pressed && !isActive && { opacity: 0.6 },
                ]}
                android_ripple={{ color: currentModeMeta.soft, borderless: false }}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabText,
                    isActive
                      ? { color: currentModeMeta.color, fontWeight: typography.weight.bold }
                      : { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                {isActive && (
                  <View style={[styles.tabIndicator, { backgroundColor: currentModeMeta.color }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ===== 탭 콘텐츠 ===== */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {renderTab()}
      </ScrollView>

      {/* 프리미엄 업셀링 (감정분석 모드에서만, recent 아닐 때) */}
      {!isRecentFlag && storeMode === 'emotion' && (
        <View style={styles.premiumBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumText}>더 자세한 분석을 원하시나요?</Text>
            <Text style={styles.premiumSubtext}>프리미엄에서 무제한 + 상세 조언</Text>
          </View>
          <Button
            mode="contained"
            compact
            onPress={() => onNavigate('subscription')}
            buttonColor={colors.primary}
            style={styles.premiumButton}
          >
            업그레이드
          </Button>
        </View>
      )}
    </View>
  );
}

// ===== 요약 탭 =====
function SummaryTab({ result, mode }) {
  if (mode === 'work') {
    // work 모드는 항상 결과 객체가 있어야 함 (없으면 빈 구조로 fallback)
    const safeResult = {
      work_summary: result?.work_summary || {
        summary: '대화 내용을 분석할 수 없어요.',
        key_points: [],
        decisions: [],
        open_questions: [],
        schedules: [],
      },
      work_integrated: result?.work_integrated || null,
      work_actions: result?.work_actions || [],
    };
    return <WorkSummaryTab result={safeResult.work_summary} integrated={safeResult.work_integrated} actions={safeResult.work_actions} />;
  }

  const comprehensive = result?.comprehensive || result?.interest;
  const e = result?.emotion;
  const i = result?.interest;
  const a = result?.advice;

  return (
    <View>
      {/* 한 줄 요약 카드 */}
      <Card style={styles.heroCard}>
        <Card.Content>
          <Text style={styles.heroLabel}>한 줄 요약</Text>
          <Text style={styles.heroText}>
            {comprehensive?.summary?.overview ||
              (e?.overall && i?.level
                ? `${e.overall} 분위기, 관심도 ${i.level}`
                : '대화 요약을 준비 중이에요')}
          </Text>
          <View style={styles.heroMeta}>
            <Chip
              icon="message-text"
              style={[styles.metaChip, { backgroundColor: colors.surfaceMuted }]}
              textStyle={styles.metaChipText}
            >
              {comprehensive?.summary?.message_count ?? '-'}개 메시지
            </Chip>
            <Chip
              icon={e?.overall === '긍정적' ? 'emoticon-happy' : 'emoticon-neutral'}
              style={[styles.metaChip, { backgroundColor: colors.modeEmotionSoft }]}
              textStyle={[styles.metaChipText, { color: colors.modeEmotion }]}
            >
              {e?.overall || '중립'} {e?.score ? `${e.score}/10` : ''}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 핵심 조언 1개 (있으면) */}
      {a?.advice && (
        <Card style={[styles.card, { backgroundColor: colors.modeEmotionSoft }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.modeEmotion }]}>💡 핵심 조언</Text>
            <Text style={styles.cardBody}>{a.advice}</Text>
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
  if (!result) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>조언 데이터를 불러오는 중이에요...</Text>
        </Card.Content>
      </Card>
    );
  }
  return <AdviceCard data={result} />;
}

// ===== 메시지별 탭 =====
function MessagesTab({ result }) {
  return <MessageAnalysisCard data={result} />;
}

// ===== 업무분석: 요약 (고수준) =====
function WorkSummaryTab({ result, integrated, actions }) {
  if (!result) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>📋 대화 내용을 정리하고 있어요...</Text>
        </Card.Content>
      </Card>
    );
  }

  const {
    summary = '',
    key_points = [],
    decisions = [],
    open_questions = [],
  } = result;

  return (
    <View>
      {/* 한 줄 요약 */}
      <Card style={styles.heroCard}>
        <Card.Content>
          <Text style={styles.heroLabel}>✨ 한 줄 요약</Text>
          <Text style={styles.heroText}>{summary || '대화 내용이 짧아요.'}</Text>
        </Card.Content>
      </Card>

      {/* 핵심 포인트 (맥락 포함) */}
      {Array.isArray(key_points) && key_points.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>📌 핵심 포인트</Text>
            {key_points.map((p, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.modeWork }]} />
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 결정 사항 */}
      {Array.isArray(decisions) && decisions.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>✅ 결정된 사항</Text>
            {decisions.map((d, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.positive }]} />
                <Text style={styles.bulletText}>{d}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 미해결 질문 */}
      {Array.isArray(open_questions) && open_questions.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>❓ 미해결 질문</Text>
            {open_questions.map((q, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.bulletText}>{q}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 액션 미리보기 (있으면) */}
      {Array.isArray(actions) && actions.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>🎯 다음 액션 미리보기</Text>
            {actions.slice(0, 3).map((a, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.bulletText}>
                  {typeof a === 'string' ? a : a.text}
                </Text>
              </View>
            ))}
            {actions.length > 3 && (
              <Text style={styles.cardFooterNote}>
                +{actions.length - 3}개 더 보기 → 통합분석 탭
              </Text>
            )}
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

// ===== 업무분석: 일정요약 탭 =====
function WorkScheduleTab({ result }) {
  if (!result) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>📅 일정을 분석 중이에요...</Text>
        </Card.Content>
      </Card>
    );
  }

  const { schedules = [], date_range = null } = result;

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>
            🗓️ 이 대화에서 확정된 일정이 없어요.{'\n'}
            시간/장소/만남 관련 메시지가 더 있으면 자동으로 리스트업돼요.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View>
      {/* 헤더 */}
      <Card style={styles.heroCard}>
        <Card.Content>
          <Text style={styles.heroLabel}>🗓️ 일정 {schedules.length}건</Text>
          <Text style={styles.heroText}>
            {date_range
              ? `${date_range.start} ~ ${date_range.end}`
              : '대화에서 언급된 시간/장소를 정리했어요'}
          </Text>
        </Card.Content>
      </Card>

      {/* 일정 리스트 */}
      {schedules.map((s, i) => (
        <Card key={i} style={styles.card}>
          <Card.Content>
            <View style={styles.scheduleHeader}>
              <View style={[styles.scheduleBadge, getScheduleBadgeStyle(s.type)]}>
                <Text style={styles.scheduleBadgeText}>
                  {getScheduleTypeIcon(s.type)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleTitle}>
                  {s.title || s.description || '일정'}
                </Text>
                {s.time && (
                  <Text style={styles.scheduleMeta}>⏰ {s.time}</Text>
                )}
                {s.location && (
                  <Text style={styles.scheduleMeta}>📍 {s.location}</Text>
                )}
                {s.participants && s.participants.length > 0 && (
                  <Text style={styles.scheduleMeta}>
                    👥 {s.participants.join(', ')}
                  </Text>
                )}
              </View>
            </View>
            {s.quote && (
              <View style={styles.scheduleQuote}>
                <Text style={styles.scheduleQuoteText}>"{s.quote}"</Text>
                {s.from && (
                  <Text style={styles.scheduleQuoteFrom}>— {s.from}</Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

function getScheduleTypeIcon(type) {
  switch (type) {
    case 'meeting': return '🤝';
    case 'deadline': return '⏰';
    case 'event': return '📅';
    case 'reminder': return '🔔';
    case 'travel': return '✈️';
    default: return '📌';
  }
}

function getScheduleBadgeStyle(type) {
  switch (type) {
    case 'meeting':
      return { backgroundColor: colors.modeWorkSoft };
    case 'deadline':
      return { backgroundColor: colors.warningSoft };
    case 'event':
      return { backgroundColor: colors.primarySoft };
    default:
      return { backgroundColor: colors.surfaceMuted };
  }
}

// ===== 업무분석: 통합분석 탭 =====
function WorkIntegratedTab({ summary, integrated, actions }) {
  if (!integrated) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.placeholder}>🧩 통합 분석을 만들고 있어요...</Text>
        </Card.Content>
      </Card>
    );
  }

  const {
    themes = [],
    theme_quotes = {},   // theme → [quote, quote, ...]
    overall_tone = '',
    tone_evidence = '',  // 분위기를 뒷받침하는 근거
    collaboration_signals = [],
    risks = [],
    risk_quotes = {},    // risk → [quote, ...]
  } = integrated;

  return (
    <View>
      {/* 전체 분위기 + 근거 */}
      {overall_tone && (
        <Card style={styles.heroCard}>
          <Card.Content>
            <Text style={styles.heroLabel}>🧩 통합 분위기</Text>
            <Text style={styles.heroText}>{overall_tone}</Text>
            {tone_evidence && (
              <Text style={styles.cardSubtext}>{tone_evidence}</Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* 주요 주제 + 인용 */}
      {Array.isArray(themes) && themes.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>🧠 주요 주제</Text>
            {themes.map((t, i) => {
              const quotes = theme_quotes?.[t] || [];
              return (
                <View key={i} style={styles.themeItem}>
                  <View style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.modeWork }]} />
                    <Text style={[styles.bulletText, styles.themeTitle]}>{t}</Text>
                  </View>
                  {quotes.length > 0 && (
                    <View style={styles.themeQuotes}>
                      {quotes.slice(0, 2).map((q, qi) => (
                        <View key={qi} style={styles.quoteItem}>
                          <Text style={styles.quoteText}>"{q.text}"</Text>
                          {q.from && (
                            <Text style={styles.quoteFrom}>— {q.from}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* 협업 시그널 */}
      {Array.isArray(collaboration_signals) && collaboration_signals.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>🤝 협업 시그널</Text>
            {collaboration_signals.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.positive }]} />
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 리스크 + 인용 */}
      {Array.isArray(risks) && risks.length > 0 && (
        <Card style={[styles.card, { backgroundColor: colors.warningSoft }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.warning }]}>⚠️ 주의할 점</Text>
            {risks.map((r, i) => {
              const quotes = risk_quotes?.[r] || [];
              return (
                <View key={i} style={styles.riskItem}>
                  <View style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.bulletText, styles.riskTitle]}>{r}</Text>
                  </View>
                  {quotes.length > 0 && (
                    <View style={styles.riskQuotes}>
                      {quotes.slice(0, 1).map((q, qi) => (
                        <View key={qi} style={styles.quoteItem}>
                          <Text style={styles.quoteText}>"{q.text}"</Text>
                          {q.from && (
                            <Text style={styles.quoteFrom}>— {q.from}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* 액션 아이템 - 구체적으로 (담당자, 마감) */}
      {Array.isArray(actions) && actions.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>🎯 다음 액션</Text>
            {actions.map((a, i) => {
              const actionText = typeof a === 'string' ? a : a.text;
              const actionFrom = typeof a === 'string' ? null : a.from;
              return (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
                    <Text style={styles.bulletText}>{actionText}</Text>
                  </View>
                  {actionFrom && (
                    <Text style={styles.actionFrom}>담당: {actionFrom}</Text>
                  )}
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

// ===== 스타일 =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  loadingBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 44,
  },
  loadingText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: 12,
    color: colors.textPrimary,
  },
  loadingSubtext: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  errorBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.negativeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorText: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: typography.lineHeight.relaxed * typography.size.md,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 44,
    paddingBottom: 8,
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

  // 채팅방으로 돌아가기 버튼
  backToKakaoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.modeEmotionSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  backToKakaoEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  backToKakaoText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.modeEmotion,
  },

  // 모드 셀렉터
  modeRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },

  // 탭 바
  tabBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    minHeight: 48,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    right: '30%',
    height: 2,
    borderRadius: 1,
  },

  // 콘텐츠
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // 히어로 카드
  heroCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  heroLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.lg,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  metaChip: {
    height: 28,
  },
  metaChipText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginVertical: 2,
  },

  // 일반 카드
  card: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  cardBody: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.md,
  },
  placeholder: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },

  // 불릿
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: spacing.md,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.relaxed * typography.size.base,
  },

  // 카드 보조 텍스트
  cardSubtext: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: typography.lineHeight.relaxed * typography.size.sm,
  },
  cardFooterNote: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'right',
  },

  // 테마/리스크/액션 아이템 (인용 포함)
  themeItem: {
    marginBottom: spacing.md,
  },
  themeTitle: {
    fontWeight: typography.weight.semibold,
  },
  themeQuotes: {
    marginLeft: 18,
    marginTop: 4,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.modeWorkSoft,
  },
  riskItem: {
    marginBottom: spacing.md,
  },
  riskTitle: {
    fontWeight: typography.weight.semibold,
    color: colors.warning,
  },
  riskQuotes: {
    marginLeft: 18,
    marginTop: 4,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.warning,
  },
  actionItem: {
    marginBottom: spacing.sm,
  },
  actionFrom: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginLeft: 18,
    marginTop: 2,
  },
  quoteItem: {
    marginBottom: 4,
  },
  quoteText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: typography.lineHeight.relaxed * typography.size.sm,
  },
  quoteFrom: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 1,
  },

  // 일정 카드
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  scheduleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  scheduleBadgeText: {
    fontSize: 18,
  },
  scheduleTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  scheduleMeta: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scheduleQuote: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
  },
  scheduleQuoteText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: typography.lineHeight.relaxed * typography.size.sm,
  },
  scheduleQuoteFrom: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // 타임라인
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.modeWork,
    marginTop: 4,
    marginRight: spacing.md,
  },
  timelineLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  timelineNote: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 프리미엄 배너
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  premiumText: {
    fontSize: typography.size.base,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  premiumSubtext: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  premiumButton: {
    borderRadius: radius.md,
  },
});

export default AnalysisScreen;
