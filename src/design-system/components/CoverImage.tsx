import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '../ThemeProvider';
import { useSignedMediaUrl } from '@/features/media/storage';

type CoverImageProps = {
  path?: string | null;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  radius?: number;
  aspectRatio?: number;
};

export function CoverImage({ path, fallbackIcon = 'images-outline', radius, aspectRatio = 1 }: CoverImageProps) {
  const theme = useTheme();
  const { data: signedUrl } = useSignedMediaUrl(path);

  return (
    <View
      style={{
        width: '100%',
        aspectRatio,
        borderRadius: radius ?? theme.radius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {signedUrl ? (
        <Image source={{ uri: signedUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
      ) : (
        <Ionicons name={fallbackIcon} size={28} color={theme.colors.textMuted} />
      )}
    </View>
  );
}
