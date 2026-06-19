/**
 * 플로팅 버블 컴포넌트
 *
 * Google Play 정책 준수:
 * - Transparency: 버블에 앱 이름/아이콘 명확히 표시
 * - User Interaction Trigger: 사용자가 반드시 "활성화"를 탭해야 표시
 * - 사용자 동의 없이는 오버레이 표시 안 함
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@floating_bubble_enabled';
const STORAGE_SHOWN_KEY = '@floating_bubble_intro_shown';

// ===== 투명 배지 (앱 이름 표시) =====
function TransparencyBadge() {
  return (
    <View style={styles.transparencyBadge}>
      <Text style={styles.transparencyBadgeText}>AI톡코치</Text>
    </View>
  );
}

// ===== 활성화 안내 모달 =====
function EnableIntroModal({ visible, onEnable, onDismiss }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalIcon}>💬</Text>
          <Text style={styles.modalTitle}>AI톡코치 플로팅 버튼</Text>

          <Text style={styles.modalBody}>
            다른 앱 위에{' '}
            <Text style={styles.highlight}>AI 답변 추천 버튼</Text>
            {' '}을 표시합니다.{'\n\n'}
            카카오톡에서 대화를 복사한 후{'\n'}
            이 버튼을 탭하면 AI 분석 결과를{'\n'}
            확인하고 답장을 복사할 수 있어요.
          </Text>

          {/* 투명성 안내 */}
          <View style={styles.transparencyBox}>
            <Text style={styles.transparencyTitle}>🔒 투명성</Text>
            <Text style={styles.transparencyText}>
              • 항상 사용자 조작(탭) 후에만 표시{'\n'}
              • 앱을離れる клавиатура上に表示{'\n'}
              • 언제든 설정에서 비활성화 가능{'\n'}
              • 모든 데이터는 기기 내에서 처리
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>사용 안 함</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={onEnable}
              activeOpacity={0.8}
            >
              <Text style={styles.enableButtonText}>활성화하기</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsLinkText}>
              Android 권한 설정에서随时 해제 가능
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ===== 드래그 가능한 버블 =====
function DraggableBubble({ children, onTap, onLongPress }) {
  const translateX = useSharedValue(20);
  const translateY = useSharedValue(100);
  const scale = useSharedValue(1);
  const context = useSharedValue({ x: 0, y: 0 });

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const BUBBLE_SIZE = 56;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      translateX.value = context.value.x + event.translationX;
      translateY.value = context.value.y + event.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);

      const maxX = screenWidth - BUBBLE_SIZE - 10;
      const maxY = screenHeight - BUBBLE_SIZE - 200;
      const minY = 60;

      if (translateX.value < screenWidth / 2 - BUBBLE_SIZE / 2) {
        translateX.value = withSpring(20);
      } else {
        translateX.value = withSpring(maxX);
      }

      if (translateY.value < minY) {
        translateY.value = withSpring(minY);
      } else if (translateY.value > maxY) {
        translateY.value = withSpring(maxY);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onTap) runOnJS(onTap)();
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onEnd(() => {
      scale.value = withSpring(0.9);
      if (onLongPress) runOnJS(onLongPress)();
    });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.bubbleContainer, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// ===== 알림 배지 =====
function AlertBadge({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.alertBadge}>
      <Text style={styles.alertBadgeText}>!</Text>
    </View>
  );
}

// ===== 플로팅 버블 메인 =====
function FloatingBubble({ onAnalyze, showBadge = false }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // ===== 사용자 동의 확인 =====
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const introShown = await AsyncStorage.getItem(STORAGE_SHOWN_KEY);

        if (stored === 'true') {
          setIsEnabled(true);
        } else if (introShown !== 'true') {
          // 첫 실행 시에만 안내 모달 표시
          setShowIntro(true);
        }
      } catch (e) {
        // 조용히 실패
      }
    };
    checkConsent();
  }, []);

  const handleEnable = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      await AsyncStorage.setItem(STORAGE_SHOWN_KEY, 'true');
    } catch (e) {}
    setIsEnabled(true);
    setShowIntro(false);
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_SHOWN_KEY, 'true');
    } catch (e) {}
    setShowIntro(false);
  };

  const handleToggleBubble = async () => {
    if (isEnabled) {
      // 비활성화
      try {
        await AsyncStorage.setItem(STORAGE_KEY, 'false');
      } catch (e) {}
      setIsEnabled(false);
    } else {
      // 활성화 (이미 한번 봤다면 바로 켜기)
      try {
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
      } catch (e) {}
      setIsEnabled(true);
    }
  };

  const handleTap = useCallback(() => {
    if (onAnalyze) {
      onAnalyze();
    } else {
      router.push('/floating-analysis');
    }
  }, [onAnalyze, router]);

  const handleLongPress = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // 활성화 안내 모달
  if (showIntro) {
    return (
      <EnableIntroModal
        visible={showIntro}
        onEnable={handleEnable}
        onDismiss={handleDismiss}
      />
    );
  }

  // 비활성 상태
  if (!isEnabled) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <DraggableBubble onTap={handleTap} onLongPress={handleLongPress}>
        <View style={styles.bubble}>
          {/* 앱 이름 라벨 (투명성) */}
          <TransparencyBadge />

          {/* 메인 아이콘 */}
          <Text style={styles.bubbleIcon}>💬</Text>
          <AlertBadge visible={showBadge} />
        </View>

        {/* 확장 메뉴 */}
        {isExpanded && (
          <View style={styles.expandedMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsExpanded(false);
                router.push('/');
              }}
            >
              <Text style={styles.menuIcon}>🏠</Text>
              <Text style={styles.menuText}>홈</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsExpanded(false);
                router.push('/floating-analysis');
              }}
            >
              <Text style={styles.menuIcon}>🤖</Text>
              <Text style={styles.menuText}>AI 분석</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setIsExpanded(false);
                handleToggleBubble();
              }}
            >
              <Text style={styles.menuIcon}>✕</Text>
              <Text style={[styles.menuText, styles.menuTextDanger]}>
                비활성화
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </DraggableBubble>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  bubbleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  bubbleIcon: {
    fontSize: 26,
  },

  // 투명성 배지
  transparencyBadge: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -30,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: 60,
    alignItems: 'center',
  },
  transparencyBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 알림 배지
  alertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 확장 메뉴
  expandedMenu: {
    position: 'absolute',
    left: 64,
    top: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 130,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
    paddingTop: 14,
  },
  menuIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  menuText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  menuTextDanger: {
    color: '#EF4444',
  },

  // 안내 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  highlight: {
    color: '#6366F1',
    fontWeight: '600',
  },
  transparencyBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transparencyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  transparencyText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  enableButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  settingsLink: {
    marginTop: 12,
  },
  settingsLinkText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default FloatingBubble;
