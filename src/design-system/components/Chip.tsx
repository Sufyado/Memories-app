import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.brand : theme.colors.surface,
          borderRadius: theme.radius.full,
        },
      ]}
    >
      <Text variant="caption" weight="semibold" color={selected ? 'onBrand' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
