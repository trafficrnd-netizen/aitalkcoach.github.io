/**
 * 프리미엄 배너
 *
 * 무료 사용자에게 프리미엄 업그레이드를 유도
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';

function PremiumBanner({ onPress, variant = 'default' }) {
  if (variant === 'compact') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Surface style={styles.compactBanner} elevation={1}>
          <View style={styles.compactLeft}>
            <Text style={styles.compactIcon}>👑</Text>
            <Text style={styles.compactText}>
              <Text style={styles.compactHighlight}>프리미엄</Text>으로{'\n'}
              무제한 분석하기
            </Text>
          </View>
          <IconButton icon="chevron-right" size={20} iconColor="#6366F1" />
        </Surface>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Surface style={styles.banner} elevation={2}>
        {/* 배경 그라데이션 효과 (단순 색상으로 표현) */}
        <View style={styles.gradientOverlay} />

        {/* 왼쪽 콘텐츠 */}
        <View style={styles.leftContent}>
          <Text style={styles.crown}>👑</Text>
          <View style={styles.textContent}>
            <Text style={styles.bannerTitle}>프리미엄으로 업그레이드</Text>
            <Text style={styles.bannerSubtitle}>
              무제한 분석 + 상세 조언
            </Text>
          </View>
        </View>

        {/* 오른쪽 화살표 */}
        <View style={styles.rightContent}>
          <IconButton
            icon="arrow-right-circle"
            size={28}
            iconColor="#FFFFFF"
            style={styles.arrowButton}
          />
        </View>

        {/* 혜택 뱃지 */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>4,900원/년</Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    backgroundColor: '#818CF8',
    opacity: 0.5,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  crown: {
    fontSize: 36,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rightContent: {
    marginLeft: 8,
  },
  arrowButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ===== Compact variant =====
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  compactText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  compactHighlight: {
    fontWeight: 'bold',
    color: '#6366F1',
  },
});

export default PremiumBanner;
