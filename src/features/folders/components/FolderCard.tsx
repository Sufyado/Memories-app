import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, CoverImage, Text } from '@/design-system';
import type { Folder } from '@/types/domain';
import { useFolderStoryCount } from '../hooks';
import { formatRelative } from '@/utils/date';

type FolderCardProps = {
  folder: Folder;
  onPress: () => void;
};

export function FolderCard({ folder, onPress }: FolderCardProps) {
  const { t, i18n } = useTranslation();
  const { data: storyCount } = useFolderStoryCount(folder.id);

  return (
    <Card onPress={onPress} style={{ overflow: 'hidden' }}>
      <CoverImage path={folder.cover_storage_path} fallbackIcon="folder-outline" aspectRatio={3 / 4} radius={0} />
      <View style={{ padding: 10, gap: 2 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {folder.name}
        </Text>
        <Text variant="caption" color="secondary">
          {t('folder.stories', { count: storyCount ?? 0 })} · {formatRelative(folder.updated_at, i18n.language)}
        </Text>
      </View>
    </Card>
  );
}
