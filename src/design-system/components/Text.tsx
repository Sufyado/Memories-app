import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../ThemeProvider';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'danger' | 'onBrand';
  align?: 'left' | 'center' | 'right' | 'auto';
};

const variantSize: Record<Variant, number> = {
  display: 34,
  title: 22,
  subtitle: 18,
  body: 16,
  caption: 13,
  label: 12,
};

const weightMap: Record<Weight, RNTextProps['style'] extends never ? never : '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function Text({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  align = 'auto',
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const colorMap = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    brand: theme.colors.brand,
    danger: theme.colors.danger,
    onBrand: theme.colors.onBrand,
  };

  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: variantSize[variant],
          fontWeight: weightMap[weight],
          color: colorMap[color],
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
