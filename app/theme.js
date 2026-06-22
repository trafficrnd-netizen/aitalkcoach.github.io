/**
 * 디자인 토큰 — 모든 화면에서 공통으로 쓰는 색/타이포/간격/그림자
 *
 * "감성적" 톤: 차가운 회색/네이비 대신 따뜻한 크림/로즈/앰버 톤으로 무게중심 이동.
 * 라이트/다크 둘 다 정의 (현재는 라이트만 사용).
 */

// ===== 컬러 =====
export const colors = {
  // 표면 (배경/카드/구분선)
  bg: '#FAF7F2',           // 따뜻한 크림톤 배경 (이전 #F9FAFB 차가운 회색 → 따뜻하게)
  surface: '#FFFFFF',
  surfaceMuted: '#F5EFE7', // 살짝 더 진한 크림 (구분 카드)
  border: '#EFE6DA',
  borderStrong: '#E2D4C0',

  // 텍스트
  textPrimary: '#2A1F1A',  // 따뜻한 다크 브라운
  textSecondary: '#6B5B4F',
  textMuted: '#A89684',
  textInverse: '#FFFFFF',

  // 브랜드
  primary: '#7C5CFF',      // 부드러운 보라 (이전 #6366F1 차가운 인디고 → 따뜻)
  primarySoft: '#EFE9FF',
  primaryStrong: '#5B3FE0',
  secondary: '#EC6FA9',    // 로즈 핑크
  secondarySoft: '#FFE6F0',
  accent: '#F4A261',       // 따뜻한 앰버

  // 감정/상태
  positive: '#3DAE7C',
  positiveSoft: '#E3F5EB',
  warning: '#E8A33C',
  warningSoft: '#FBEED6',
  negative: '#D4583E',
  negativeSoft: '#FCE5DE',
  info: '#5B8FCB',
  infoSoft: '#E2EDF8',

  // 모드 색상 (감정분석 vs 업무분석)
  modeEmotion: '#7C5CFF',
  modeEmotionSoft: '#EFE9FF',
  modeWork: '#3DAE7C',
  modeWorkSoft: '#E3F5EB',
  modeQuick: '#F4A261',
  modeQuickSoft: '#FBEED6',

  // 그림자 색
  shadow: '#2A1F1A',
};

// ===== 타이포 =====
export const typography = {
  // 폰트 패밀리 (시스템 기본)
  family: {
    regular: undefined,   // OS 기본
    medium: undefined,
    semibold: undefined,
    bold: undefined,
  },
  // 사이즈
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  // 굵기
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // 행간
  lineHeight: {
    tight: 1.25,
    base: 1.5,
    relaxed: 1.7,
  },
};

// ===== 간격 (4px 스케일) =====
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
};

// ===== 라운드 =====
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 999,
};

// ===== 그림자 (iOS/Android 모두 부드럽게) =====
export const shadow = {
  // 미니멀 카드는 그림자 거의 없음
  none: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// ===== 분석 모드 라벨/색 =====
export const analysisMode = {
  emotion: {
    key: 'emotion',
    label: '감정분석',
    shortLabel: '감정',
    icon: '💗',
    description: '대화의 감정·관심·답장 추천',
    color: colors.modeEmotion,
    soft: colors.modeEmotionSoft,
  },
  work: {
    key: 'work',
    label: '업무분석',
    shortLabel: '업무',
    icon: '💼',
    description: '대화 내용 요약 + 통합 분석',
    color: colors.modeWork,
    soft: colors.modeWorkSoft,
  },
  quick: {
    key: 'quick',
    label: '빠른 조언',
    shortLabel: '조언',
    icon: '⚡',
    description: '짧은 텍스트에 대한 즉석 조언',
    color: colors.modeQuick,
    soft: colors.modeQuickSoft,
  },
};

export default {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  analysisMode,
};
