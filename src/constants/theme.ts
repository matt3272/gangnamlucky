/**
 * 신묘 (神妙) - React Native Paper 테마 설정
 */

import { MD3LightTheme } from 'react-native-paper';
import { Colors } from './colors';

/**
 * App Theme (iOS 스타일)
 */
export const appTheme = {
  ...MD3LightTheme,
  roundness: 10,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryBg,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryLight,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceLight,
    error: Colors.error,
    onPrimary: Colors.white,
    onSecondary: Colors.white,
    onBackground: Colors.text,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    elevation: {
      level0: 'transparent',
      level1: Colors.surface,
      level2: Colors.surface,
      level3: Colors.surface,
      level4: Colors.surface,
      level5: Colors.surface,
    },
  },
};

/**
 * 공통 스타일 설정
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  round: 999,
} as const;

export const fontSize = {
  xs: 11,    // caption2
  sm: 13,    // footnote
  md: 17,    // body
  lg: 20,    // title3
  xl: 22,    // title2
  xxl: 28,   // title1
  xxxl: 34,  // largeTitle
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
