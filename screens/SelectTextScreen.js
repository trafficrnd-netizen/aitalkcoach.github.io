/**
 * 텍스트 선택 스크린
 *
 * 카톡 알림/클립보드/접근성서비스로 들어온 텍스트를 AI 분석에 보내기 전에
 * 사용자가 어떤 메시지를 분석할지 직접 선택하는 단계.
 *
 * - store.currentAnalysisText 를 읽어 파싱 → 메시지 카드 리스트로 표시
 * - 각 카드를 탭하면 선택/해제
 * - "전체 선택" / "선택 해제" 빠른 액션 제공
 * - "분석 시작" 누르면 선택된 텍스트만으로 store 갱신 후 /analysis 로 이동
 *
 * 참고: file upload 플로우(HomeScreen)도 동일한 setCurrentAnalysis + /analysis
 * 라우팅을 쓰지만, 파일은 사용자가 이미 통째로 선택한 단위이므로 본 스크린을
 * 거치지 않는다 (file source 는 handleStartAnalysis 에서 바로 /analysis).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, IconButton, Chip, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { parseKakaoTalkFile } from '../kakaotalk-parser/parser';
import { useAppStore } from '../store/appStore';
import ModeSelector from '../components/ModeSelector';
import { colors, spacing, radius, shadow, typography, analysisMode } from '../app/theme';

/**
 * 텍스트에서 분석 대상이 될 메시지 단위 배열로 변환.
 *
 * 우선 파서(parseKakaoTalkFile)를 시도하고, 결과가 0건이면 줄 단위 fallback.
 * [ASSUMPTION] parser는 "이름 : 메시지" 또는 "오전/오후 H:MM 이름 : 메시지" 형식 처리.
 *              단문 알림 본문(시간/이름 prefix 없는 경우)은 0건 리턴 → fallback 진입.
 */
function extractMessages(rawText) {
  const safeText = typeof rawText === 'string' ? rawText : '';

  // 1) 파서 시도
  try {
    const parsed = parseKakaoTalkFile(safeText);
    if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
      // [UNVERIFIED] parsed.messages의 필드(sender/content/timestamp)는
      //              kakaotalk-parser/parser.js 의 구조에 의존 — parser.js 확인 완료.
      return parsed.messages.map((m, i) => ({
        id: `p-${i}`,
        sender: m.sender || (m.isFromMe ? '나' : '상대방'),
        content: m.content || '',
        timestamp: m.timestamp instanceof Date ? m.timestamp : null,
        isFromMe: !!m.isFromMe,
        raw: m.rawLine || m.content || '',
      }));
    }
  } catch (e) {
    // [FAIL-FAST] 파서가 throw 해도 UI는 죽지 않게 fallback 으로 진행
  }

  // 2) 줄 단위 fallback
  const lines = safeText
    .split(/\r?\n/)
    .map((l) => (typeof l === 'string' ? l.trim() : ''))
    .filter(Boolean);

  // [FIX] 줄 단위 fallback 에서도 "[오후 3:30]" 같은 시간 prefix / [bracket] 정리
  //   클립보드에서 복사한 텍스트에 시간 prefix가 남아있는 경우
  //   (예: "[오후 3:30] 김철수 : 안녕?" → sender "[] 김철수" 가 되는 문제)
  const cleanLine = (line) => {
    let s = line;
    // 앞쪽 [오전/오후 H:MM] 또는 [HH:MM] 형식 제거
    s = s.replace(/^\s*\[[^\]]*?(\d{1,2})[:시](\d{1,2})?분?[^\]]*?\]\s*/, '');
    // 양 끝 [ ] 잔여물 제거
    s = s.replace(/^[\s\[\]]+/, '').replace(/[\s\[\]]+$/, '').trim();
    return s;
  };

  return lines.map((line, i) => {
    const cleaned = cleanLine(line);
    if (!cleaned) return null;
    const match = cleaned.match(/^([^:]+?)\s*:\s*(.+)$/);
    if (match) {
      return {
        id: `l-${i}`,
        sender: match[1].trim(),
        content: match[2].trim(),
        timestamp: null,
        isFromMe: false,
        raw: cleaned,
      };
    }
    return {
      id: `l-${i}`,
      sender: '메시지',
      content: cleaned,
      timestamp: null,
      isFromMe: false,
      raw: cleaned,
    };
  }).filter(Boolean);
}

function formatTime(ts) {
  if (!(ts instanceof Date) || Number.isNaN(ts.getTime())) return '';
  try {
    return ts.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    });
  } catch {
    return '';
  }
}

export default function SelectTextScreen() {
  const router = useRouter();
  const currentText = useAppStore((s) => s.currentAnalysisText);
  const currentSource = useAppStore((s) => s.currentAnalysisSource);
  const currentSender = useAppStore((s) => s.currentAnalysisSender);
  const currentMode = useAppStore((s) => s.currentAnalysisMode);
  const setCurrentAnalysis = useAppStore((s) => s.setCurrentAnalysis);
  const setAnalysisMode = useAppStore((s) => s.setAnalysisMode);

  // [FAIL-FAST] 텍스트가 없으면 곧바로 알림 + 홈으로. 분석 자체가 불가.
  const hasText = typeof currentText === 'string' && currentText.trim().length > 0;

  const messages = useMemo(
    () => (hasText ? extractMessages(currentText) : []),
    [currentText, hasText],
  );

  // 초기에는 모든 메시지 선택. 텍스트가 바뀌면 선택도 리셋.
  const [selected, setSelected] = useState(() => new Set(messages.map((m) => m.id)));

  useEffect(() => {
    setSelected(new Set(messages.map((m) => m.id)));
  }, [messages]);

  const selectedCount = selected.size;
  const allSelected = messages.length > 0 && selectedCount === messages.length;
  const noneSelected = selectedCount === 0;

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(messages.map((m) => m.id)));
  }, [messages]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  /**
   * 선택된 메시지들을 원본 순서대로 다시 텍스트로 직렬화.
   * 파서가 만든 rawLine 이 있으면 그걸 우선 사용(원본 형식 보존),
   * 없으면 "sender: content" 형태로 합성.
   */
  const buildSelectedText = useCallback(() => {
    const picked = messages.filter((m) => selected.has(m.id));
    if (picked.length === 0) return '';
    return picked
      .map((m) => {
        // [UNVERIFIED] raw 는 parser가 채워주거나 fallback 에서 line 자체.
        //              비어있을 수 있어 방어적으로 처리.
        if (typeof m.raw === 'string' && m.raw.length > 0) return m.raw;
        const sender = m.sender || (m.isFromMe ? '나' : '상대방');
        return `${sender}: ${m.content}`;
      })
      .join('\n');
  }, [messages, selected]);

  const handleAnalyze = useCallback(() => {
    if (noneSelected) {
      Alert.alert('알림', '분석할 메시지를 1개 이상 선택해주세요.');
      return;
    }
    const text = buildSelectedText();
    if (!text) {
      Alert.alert('오류', '선택된 텍스트가 비어 있습니다.');
      return;
    }

    // store 갱신: 텍스트/소스/발신자 + 현재 선택된 분석 모드
    setCurrentAnalysis(
      text,
      currentSource || 'kakao-notif',
      currentSender || null,
      currentMode,
    );
    router.replace('/analysis');
  }, [
    noneSelected,
    buildSelectedText,
    setCurrentAnalysis,
    currentSource,
    currentSender,
    currentMode,
    router,
  ]);

  const handleModeChange = useCallback(
    (nextMode) => {
      if (nextMode && nextMode !== currentMode) {
        setAnalysisMode(nextMode);
      }
    },
    [currentMode, setAnalysisMode],
  );

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  // ----- 비어있는 텍스트 -----
  if (!hasText) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="message-text-outline" size={64} iconColor="#9CA3AF" />
        <Text style={styles.emptyTitle}>분석할 텍스트가 없습니다</Text>
        <Text style={styles.emptyDesc}>
          카톡 알림이 오면 자동으로 이 화면에 표시됩니다.{'\n'}
          또는 홈에서 대화 파일을 선택해 분석을 시작하세요.
        </Text>
        <Button mode="contained" onPress={handleBack} style={styles.emptyButton}>
          홈으로
        </Button>
      </View>
    );
  }

  // ----- 메시지 없음 (전부 빈 줄이거나 파싱 실패) -----
  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="alert-circle-outline" size={64} iconColor="#F59E0B" />
        <Text style={styles.emptyTitle}>메시지를 찾지 못했습니다</Text>
        <Text style={styles.emptyDesc}>
          입력된 텍스트가 비어 있거나 인식할 수 없는 형식입니다.
        </Text>
        <Button mode="contained" onPress={handleBack} style={styles.emptyButton}>
          돌아가기
        </Button>
      </View>
    );
  }

  const sourceLabel = (() => {
    if (currentSource === 'clipboard') return '📋 클립보드';
    if (currentSource === 'kakao-chat') return '💬 카톡 채팅';
    if (currentSource === 'kakao-notif') return '🔔 카톡 알림';
    if (currentSource === 'kakao-copy') return '📋 카톡 복사';
    return '✉️ 수신 텍스트';
  })();

  return (
    <View style={styles.container}>
      {/* ===== 헤더 ===== */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={handleBack} iconColor="#1F2937" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>분석할 메시지 선택</Text>
          <Text style={styles.headerSubtitle}>
            {selectedCount}/{messages.length}개 선택됨
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* ===== 출처 정보 카드 ===== */}
      <View style={styles.sourceRow}>
        <Chip icon="information" style={styles.sourceChip} textStyle={styles.sourceChipText}>
          {sourceLabel}
        </Chip>
        {typeof currentSender === 'string' && currentSender.length > 0 && (
          <Chip icon="account" style={styles.sourceChip} textStyle={styles.sourceChipText}>
            {currentSender}
          </Chip>
        )}
      </View>

      {/* ===== 분석 모드 선택 ===== */}
      <View style={styles.modeRow}>
        <ModeSelector
          value={currentMode}
          onChange={handleModeChange}
          options={['emotion', 'work']}
          compact
        />
      </View>

      {/* ===== 빠른 액션 바 ===== */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.quickBtn, allSelected && styles.quickBtnDisabled]}
          onPress={selectAll}
          disabled={allSelected}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickBtnText, allSelected && styles.quickBtnTextDisabled]}>
            전체 선택
          </Text>
        </TouchableOpacity>
        <View style={styles.quickDivider} />
        <TouchableOpacity
          style={[styles.quickBtn, noneSelected && styles.quickBtnDisabled]}
          onPress={deselectAll}
          disabled={noneSelected}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickBtnText, noneSelected && styles.quickBtnTextDisabled]}>
            선택 해제
          </Text>
        </TouchableOpacity>
      </View>

      <Divider />

      {/* ===== 메시지 리스트 ===== */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => {
          const isSelected = selected.has(m.id);
          const time = formatTime(m.timestamp);
          return (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.7}
              onPress={() => toggleOne(m.id)}
              style={[
                styles.messageCard,
                isSelected ? styles.messageCardSelected : styles.messageCardUnselected,
              ]}
            >
              <View style={styles.messageHeader}>
                <View
                  style={[
                    styles.checkbox,
                    isSelected ? styles.checkboxOn : styles.checkboxOff,
                  ]}
                >
                  {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.senderText,
                    m.isFromMe && styles.senderTextMe,
                  ]}
                  numberOfLines={1}
                >
                  {m.sender}
                  {m.isFromMe ? ' (나)' : ''}
                </Text>
                {time.length > 0 && (
                  <Text style={styles.timeText}>{time}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.contentText,
                  !isSelected && styles.contentTextDim,
                ]}
              >
                {m.content}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.listFooterHint}>
          <Text style={styles.listFooterHintText}>
            분석에는 선택된 메시지만 사용됩니다. 분석 후 결과 화면에서 추천 답장도 받을 수 있어요.
          </Text>
        </View>
      </ScrollView>

      {/* ===== 하단 분석 시작 버튼 ===== */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerInfoText}>
            {selectedCount === 0
              ? '메시지를 선택해주세요'
              : selectedCount === messages.length
              ? '전체 메시지 분석'
              : `${selectedCount}개 메시지 분석`}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handleAnalyze}
          disabled={noneSelected}
          loading={false}
          style={[styles.analyzeButton, noneSelected && styles.analyzeButtonDisabled]}
          contentStyle={styles.analyzeButtonContent}
          icon="chart-line"
        >
          {selectedCount === 0 ? '선택 필요' : 'AI 분석 시작'}
        </Button>
      </View>
    </View>
  );
}

// ===== 스타일 =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 48,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
    marginTop: 2,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  sourceChip: {
    backgroundColor: '#EEF2FF',
  },
  sourceChipText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  quickBtnDisabled: {
    backgroundColor: '#F9FAFB',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  quickBtnTextDisabled: {
    color: '#9CA3AF',
  },
  quickDivider: {
    width: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  messageCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  messageCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxOn: {
    backgroundColor: '#6366F1',
  },
  checkboxOff: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  senderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  senderTextMe: {
    color: '#4F46E5',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  contentText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    paddingLeft: 30,
  },
  contentTextDim: {
    color: '#6B7280',
  },
  listFooterHint: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  listFooterHintText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  footerInfo: {
    flex: 1,
  },
  footerInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  analyzeButton: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  analyzeButtonContent: {
    paddingVertical: 6,
  },
});
