import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/design-system';
import { useSignedMediaUrl } from '../storage';
import type { Media } from '@/types/domain';

type MediaThumbnailProps = {
  media: Media | undefined;
  radius?: number;
};

export function MediaThumbnail({ media, radius }: MediaThumbnailProps) {
  const theme = useTheme();
  const path = media?.thumbnail_path ?? media?.storage_path;
  const { data: signedUrl } = useSignedMediaUrl(path);

  return (
    <View
      style={{
        flex: 1,
        borderRadius: radius ?? theme.radius.sm,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {signedUrl ? (
        <Image source={{ uri: signedUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={100} />
      ) : (
        <Ionicons
          name={media?.type === 'video' ? 'videocam-outline' : 'image-outline'}
          size={22}
          color={theme.colors.textMuted}
        />
      )}
      {media?.type === 'video' ? (
        <View
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="play" size={14} color="#fff" />
        </View>
      ) : null}
    </View>
  );
}
