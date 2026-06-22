/**
 * FloatingBubbleController
 *
 * 다른 앱 위에 떠 있는 native bubble을 제어하는 thin wrapper.
 * 실제 UI(드래그 가능한 원형 버튼)는 android BubbleService + TYPE_APPLICATION_OVERLAY로 그려짐.
 *
 * 흐름:
 *  1) mount → hasPermission 체크 → 없으면 requestPermission
 *  2) 권한 있으면 BubbleService.start (포어그라운드 서비스 → WindowManager addView)
 *  3) bubble 짧은 탭 → 앱 foreground로 (native 측에서 launchIntent)
 *  4) unmount → BubbleService.stop
 *
 * Google Play 정책:
 *  - 사용자 명시적 동의 (활성화 버튼) 후에만 start
 *  - "AI톡코치" 라벨이 bubble에 항상 표시됨 (bubble_view.xml)
 *  - 끌 때는 unmount 또는 사용자가 알림 → 서비스 중지
 */
import React, { useEffect, useState } from 'react';
import { NativeModules, Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const { FloatingBubble } = NativeModules;

export default function FloatingBubbleController({ onAnalyze }) {
  const [state, setState] = useState('checking'); // 'checking' | 'granted' | 'denied' | 'unsupported'

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setState('unsupported');
      return;
    }
    if (!FloatingBubble) {
      console.warn('[FloatingBubble] native module 없음');
      setState('unsupported');
      return;
    }

    let cancelled = false;
    let started = false;

    (async () => {
      try {
        const granted = await FloatingBubble.hasPermission();
        if (cancelled) return;
        if (!granted) {
          setState('denied');
          return;
        }
        await FloatingBubble.start();
        if (cancelled) {
          FloatingBubble.stop();
          return;
        }
        started = true;
        setState('granted');
      } catch (e) {
        console.warn('[FloatingBubble] start 실패:', e.message);
        if (!cancelled) setState('denied');
      }
    })();

    return () => {
      cancelled = true;
      if (started) {
        FloatingBubble.stop().catch(() => {});
      }
    };
  }, []);

  // 권한 없을 때 UI (활성화 버튼) — 첫 화면 진입 시 사용자가 명시적으로 탭하도록
  if (state === 'denied') {
    return (
      <View style={styles.banner} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            try {
              await FloatingBubble.requestPermission();
              // 사용자가 설정에서 돌아오면 hasPermission 재체크
              setTimeout(async () => {
                const granted = await FloatingBubble.hasPermission();
                if (granted) setState('checking'); // useEffect 재실행 트릭
              }, 1500);
            } catch (e) {
              console.warn('[FloatingBubble] requestPermission 실패:', e.message);
            }
          }}
        >
          <Text style={styles.buttonText}>💬 다른 앱에서도 AI 분석 켜기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
