export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

const palette = {
  black: '#0B0C0F',
  white: '#FFFFFF',
  ink900: '#111318',
  ink800: '#1B1D24',
  ink700: '#262933',
  ink600: '#3A3D4A',
  mist100: '#F5F5F7',
  mist200: '#ECEDF1',
  mist300: '#DDDFE6',
  mist400: '#B8BAC4',
  brand: '#5B4CFF',
  brandDark: '#7C6FFF',
  coral: '#FF5A6E',
  amber: '#FFB020',
  green: '#2FBF71',
};

export const lightColors = {
  background: palette.white,
  surface: palette.mist100,
  surfaceRaised: palette.white,
  border: palette.mist300,
  textPrimary: palette.ink900,
  textSecondary: palette.ink600,
  textMuted: palette.mist400,
  onBrand: palette.white,
  brand: palette.brand,
  danger: palette.coral,
  warning: palette.amber,
  success: palette.green,
  overlay: 'rgba(11,12,15,0.55)',
  storyBg: palette.black,
};

export const darkColors = {
  background: palette.ink900,
  surface: palette.ink800,
  surfaceRaised: palette.ink700,
  border: palette.ink600,
  textPrimary: palette.white,
  textSecondary: palette.mist400,
  textMuted: '#6B6E7A',
  onBrand: palette.white,
  brand: palette.brandDark,
  danger: palette.coral,
  warning: palette.amber,
  success: palette.green,
  overlay: 'rgba(0,0,0,0.65)',
  storyBg: palette.black,
};

export type ColorTokens = typeof lightColors;
