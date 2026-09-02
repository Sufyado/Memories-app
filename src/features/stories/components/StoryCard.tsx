import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, CoverImage, Text, useTheme } from '@/design-system';
import type { StoryWithSlideCount } from '../api';
import { formatRelative } from '@/utils/date';

type StoryCardProps = {
  story: StoryWithSlideCount;
  layout: 'grid' | 'list';
  onPress: () => void;
};

export function StoryCard({ story, layout, onPress }: StoryCardProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  if (layout === 'list') {
    return (
      <Card onPress={onPress} style={{ flexDirection: 'row', padding: 10, gap: 12, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56 }}>
          <CoverImage path={story.cover_storage_path} fallbackIcon="albums-outline" aspectRatio={1} radius={theme.radius.sm} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {story.title || t('common.untitled')}
          </Text>
          <Text variant="caption" color="secondary">
            {t('story.slides', { count: story.slide_count })} · {formatRelative(story.updated_at, i18n.language)}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={onPress} style={{ overflow: 'hidden' }}>
      <CoverImage path={story.cover_storage_path} fallbackIcon="albums-outline" aspectRatio={3 / 4} radius={0} />
      <View style={{ padding: 10, gap: 2 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {story.title || t('common.untitled')}
        </Text>
        <Text variant="caption" color="secondary">
          {t('story.slides', { count: story.slide_count })}
        </Text>
      </View>
    </Card>
  );
}
