import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

export type ButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  fullWidth,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bg = {
    primary: theme.colors.brand,
    secondary: theme.colors.surface,
    ghost: 'transparent',
    danger: theme.colors.danger,
  }[variant];

  const textColor: 'onBrand' | 'primary' | 'brand' =
    variant === 'primary' || variant === 'danger' ? 'onBrand' : variant === 'ghost' ? 'brand' : 'primary';

  const height = { sm: 36, md: 48, lg: 56 }[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          height,
          borderRadius: theme.radius.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: theme.colors.border,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor === 'onBrand' ? theme.colors.onBrand : theme.colors.brand} />
      ) : (
        <>
          {icon}
          <Text variant="body" weight="semibold" color={textColor}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
});
