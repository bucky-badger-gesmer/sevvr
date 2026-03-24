import { Platform, TextStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FAF7F2',
    surface: '#F5F2EB',
    surfaceElevated: '#FFFFFF',
    tint: '#C67D5E',
    icon: '#6B6B6B',
    tabIconDefault: '#6B6B6B',
    tabIconSelected: '#C67D5E',
    border: '#E5E0D8',
    success: '#8FA88B',
    warning: '#B87333',
    error: '#722F37',
    accent: '#D4A853',
    muted: '#9A9A9A',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0D1F1C',
    surface: '#152A26',
    surfaceElevated: '#1A3530',
    tint: '#D4A853',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#D4A853',
    border: '#2A3D38',
    success: '#8FA88B',
    warning: '#B87333',
    error: '#C67D5E',
    accent: '#C67D5E',
    muted: '#6B6B6B',
  },
};

export type ColorScheme = keyof typeof Colors;

export const Typography = {
  display: {
    fontFamily: Platform.select({
      ios: 'Fraunces',
      android: 'Fraunces',
      web: 'Fraunces, Georgia, serif',
    }) as string,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  heading: {
    fontFamily: Platform.select({
      ios: 'Fraunces',
      android: 'Fraunces',
      web: 'Fraunces, Georgia, serif',
    }) as string,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontFamily: Platform.select({
      ios: 'DM Sans',
      android: 'DM Sans',
      web: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    }) as string,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  bodyMedium: {
    fontFamily: Platform.select({
      ios: 'DM Sans',
      android: 'DM Sans',
      web: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    }) as string,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  bodySemiBold: {
    fontFamily: Platform.select({
      ios: 'DM Sans',
      android: 'DM Sans',
      web: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    }) as string,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  mono: {
    fontFamily: Platform.select({
      ios: 'JetBrains Mono',
      android: 'JetBrains Mono',
      web: 'JetBrains Mono, SF Mono, Consolas, monospace',
    }) as string,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'DM Sans',
    serif: 'Fraunces',
    rounded: 'DM Sans',
    mono: 'JetBrains Mono',
  },
  android: {
    sans: 'DM Sans',
    serif: 'Fraunces',
    rounded: 'DM Sans',
    mono: 'JetBrains Mono',
  },
  web: {
    sans: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    serif: 'Fraunces, Georgia, serif',
    rounded: 'DM Sans, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'JetBrains Mono, SF Mono, Consolas, monospace',
  },
});