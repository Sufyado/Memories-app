import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';

type IconButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onLongPress?: () => void;
  size?: number;
  variant?: 'solid' | 'ghost' | 'overlay';
  style?: ViewStyle;
  accessibilityLabel: string;
};

export function IconButton({
  children,
  onPress,
  onPressIn,
  onLongPress,
  size = 40,
  variant = 'ghost',
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const theme = useTheme();
  const bg = {
    solid: theme.colors.surface,
    ghost: 'transparent',
    overlay: 'rgba(0,0,0,0.35)',
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onLongPress={onLongPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
