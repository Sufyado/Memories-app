import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '../ThemeProvider';
import { Text } from './Text';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
};

export function Avatar({ uri, name, size = 36 }: AvatarProps) {
  const theme = useTheme();
  const initials = (name ?? '?').trim().slice(0, 1).toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.surface }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="caption" weight="bold" color="onBrand">
        {initials}
      </Text>
    </View>
  );
}
