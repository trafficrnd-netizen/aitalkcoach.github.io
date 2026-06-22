/**
 * 분석 모드 세그먼티드 컨트롤
 *
 * 감정분석 / 업무분석 / 빠른 조언 세 모드를 토글.
 * 3개 모두 보일 때는 가로 스크롤 없이 들어가도록 컴팩트하게.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, spacing, radius, shadow, typography, analysisMode } from '../app/theme';

/**
 * @param {Object} props
 * @param {'emotion'|'work'|'quick'} props.value - 선택된 모드
 * @param {(mode: string) => void} props.onChange - 변경 핸들러
 * @param {Array<'emotion'|'work'|'quick'>} [props.options] - 표시할 모드들 (기본: 전부)
 * @param {string} [props.label] - 상단 라벨 (선택)
 * @param {string} [props.description] - 선택된 모드의 설명
 * @param {boolean} [props.compact] - true면 아이콘만 표시, 한 줄에 다 들어감
 */
export default function ModeSelector({
  value,
  onChange,
  options = ['emotion', 'work', 'quick'],
  label,
  description,
  compact = false,
}) {
  const visible = useMemo(
    () => options.map((k) => analysisMode[k]).filter(Boolean),
    [options],
  );

  const activeMeta = analysisMode[value];

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.pillRow}>
        {visible.map((m) => {
          const isActive = m.key === value;
          return (
            <Pressable
              key={m.key}
              onPress={() => onChange(m.key)}
              style={({ pressed }) => [
                styles.pill,
                compact && styles.pillCompact,
                isActive && { backgroundColor: m.color },
                pressed && !isActive && styles.pillPressed,
              ]}
              android_ripple={{ color: m.soft, borderless: false }}
            >
              <Text style={styles.pillIcon}>{m.icon}</Text>
              <Text
                style={[
                  styles.pillText,
                  compact && styles.pillTextCompact,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
                numberOfLines={1}
              >
                {compact ? m.shortLabel : m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {description && activeMeta && (
        <Text style={[styles.description, { color: activeMeta.color }]}>
          {description || activeMeta.description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
  },
  pillCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  pillPressed: {
    opacity: 0.6,
  },
  pillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  pillTextCompact: {
    fontSize: typography.size.sm,
  },
  pillTextActive: {
    color: colors.textInverse,
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
