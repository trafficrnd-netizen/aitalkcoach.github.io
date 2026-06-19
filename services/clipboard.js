/**
 * 클립보드 모니터링 서비스
 *
 * 클립보드 변화를 감지하여 카카오톡 메시지로 간주할 경우 분석 유도
 */

import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// ===== 패턴 정의 =====
const KAKAO_MESSAGE_PATTERNS = [
  /^[0-9]{4}년\s?[0-9]{1,2}월/, // 날짜: 2024년 1월 15일
  /^(오전|오후)\s?[0-9]{1,2}:[0-9]{2}/, // 시간: 오전 3:30
  /^[\uAC00-\uD7A3]{2,5}\s*:\s*/, // 이름 : 메시지
  /\([A-Za-z0-9가-힣]+\)/, // (You) 같은 이름 표시
];

const SENSITIVE_PATTERNS = [
  /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/, // 전화번호
  /[\uAC00-\uD7A3]{2,4}[동로번가]\s*[\uAC00-\uD7A3]+/, // 주소
  /\d{10,}/, // 긴 숫자 (계좌번호 등)
];

// ===== 감지 함수 =====
export function isKakaoMessage(text) {
  if (!text || text.length < 5 || text.length > 5000) return false;

  // 민감정보 포함 체크
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) return false;
  }

  // 카카오톡 메시지 패턴 체크
  let matchCount = 0;
  for (const pattern of KAKAO_MESSAGE_PATTERNS) {
    if (pattern.test(text)) {
      matchCount++;
      if (matchCount >= 1) return true;
    }
  }

  // 대화 형식 체크 (여러 줄)
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length >= 2) {
    // 최소 2줄 이상 + 한국어 포함
    const hasKorean = /[\uAC00-\uD7A3]/.test(text);
    return hasKorean;
  }

  return false;
}

export function maskSensitiveInClipboard(text) {
  let masked = text;
  masked = masked.replace(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g, '[전화번호]');
  masked = masked.replace(/\d{10,}/g, '[숫자]');
  return masked;
}

// ===== 훅: 클립보드 모니터링 =====
export function useClipboardMonitor({ onMessageDetected, onClipboardChange, interval = 2000 }) {
  const [clipboardText, setClipboardText] = useState('');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const lastCheckedRef = useRef('');
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const checkClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || text === lastCheckedRef.current) return;

      lastCheckedRef.current = text;
      setClipboardText(text);

      if (onClipboardChange) {
        onClipboardChange(text);
      }

      // 카카오톡 메시지 감지
      if (isKakaoMessage(text)) {
        setHasNewMessage(true);
        if (onMessageDetected) {
          onMessageDetected(text);
        }
      }
    } catch (error) {
      // 권한 없음 등 - 조용히 실패
    }
  }, [onMessageDetected, onClipboardChange]);

  // AppState 변경 감지 (앱 포그라운드로 복귀 시 체크)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkClipboard();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkClipboard]);

  // 주기적 체크 (포그라운드에서만)
  useEffect(() => {
    // 초기 체크
    checkClipboard();

    // interval마다 체크
    intervalRef.current = setInterval(checkClipboard, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkClipboard, interval]);

  // 클립보드 초기화 (탭 후)
  const clearNewMessageFlag = useCallback(() => {
    setHasNewMessage(false);
  }, []);

  return {
    clipboardText,
    hasNewMessage,
    clearNewMessageFlag,
    isKakaoMessage: hasNewMessage,
  };
}

// ===== 유틸: 클립보드 복사 =====
export async function copyToClipboard(text) {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
}
