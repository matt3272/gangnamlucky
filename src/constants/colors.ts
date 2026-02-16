/**
 * 신묘 (神妙) - iOS 시스템 컬러 팔레트
 */

export const Colors = {
  // Primary Colors (iOS 시스템 인디고)
  primary: '#5856D6',
  primaryDark: '#3634A3',
  primaryLight: '#7A78E2',
  primaryBg: '#F2F2F7',

  // Secondary Colors
  secondary: '#FF2D55',
  secondaryDark: '#D70035',
  secondaryLight: '#FF6482',

  // Background Colors (iOS systemGroupedBackground)
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceLight: '#F2F2F7',
  surfaceElevated: '#FFFFFF',

  // Text Colors (iOS Label 시스템)
  text: '#000000',
  textLight: '#1C1C1E',
  textSecondary: 'rgba(60, 60, 67, 0.6)',
  textMuted: 'rgba(60, 60, 67, 0.3)',

  // Border
  border: 'rgba(60, 60, 67, 0.12)',
  borderLight: 'rgba(60, 60, 67, 0.06)',

  // Status Colors (iOS 시스템)
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',

  // 오행 색상 (iOS 시스템 컬러)
  wood: '#34C759',   // 목 - 초록 (systemGreen)
  fire: '#FF3B30',   // 화 - 빨강 (systemRed)
  earth: '#FF9500',  // 토 - 주황 (systemOrange)
  metal: '#8E8E93',  // 금 - 실버 (systemGray)
  water: '#007AFF',  // 수 - 파랑 (systemBlue)

  // Neutral Colors (iOS 그레이 스케일)
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#D1D1D6',
  gray400: '#C7C7CC',
  gray500: '#AEAEB2',
  gray600: '#8E8E93',
  gray700: '#636366',
  gray800: '#48484A',
  gray900: '#1C1C1E',

  // Transparency
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.06)',
} as const;
