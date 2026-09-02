import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useTheme } from '../ThemeProvider';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
};

export function Card({ children, onPress, onLongPress, style }: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  };

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [base, style, { opacity: pressed ? 0.9 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}
