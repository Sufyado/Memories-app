import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, radius, spacing, fontSize, type ColorTokens } from './tokens';

type Theme = {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  dark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const theme = useMemo<Theme>(
    () => ({
      colors: dark ? darkColors : lightColors,
      spacing,
      radius,
      fontSize,
      dark,
    }),
    [dark],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
