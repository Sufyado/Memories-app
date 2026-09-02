import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button, Card, Input, Screen, Text, useTheme } from '@/design-system';
import { useCreateStory } from '@/features/stories/hooks';
import { useFolders } from '@/features/folders/hooks';

export default function NewStoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ folderId?: string }>();

  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<string | null>(params.folderId ?? null);
  const folders = useFolders(null);
  const createStory = useCreateStory();

  async function onSave() {
    if (!title.trim()) return;
    const story = await createStory.mutateAsync({ title: title.trim(), folderId });
    router.replace(`/story/${story.id}/edit`);
  }

  return (
    <Screen scroll>
      <View style={{ gap: 20, paddingTop: 12 }}>
        <Text variant="display" weight="bold">
          {t('story.new')}
        </Text>

        <Input label={t('story.title')} value={title} onChangeText={setTitle} autoFocus placeholder={t('common.untitled')} />

        <View style={{ gap: 8 }}>
          <Text variant="label" weight="semibold" color="secondary">
            {t('story.chooseFolder')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <FolderChip label={t('folder.unfiled')} selected={folderId === null} onPress={() => setFolderId(null)} />
            {folders.data?.map((f) => (
              <FolderChip key={f.id} label={f.name} selected={folderId === f.id} onPress={() => setFolderId(f.id)} />
            ))}
          </View>
        </View>

        <Card style={{ padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Ionicons name="images-outline" size={18} color={theme.colors.textSecondary} />
          <Text variant="caption" color="secondary" style={{ flex: 1 }}>
            {t('story.addSlides')} — {t('story.reorderHint')}
          </Text>
        </Card>

        <Button label={t('common.save')} onPress={onSave} loading={createStory.isPending} disabled={!title.trim()} fullWidth size="lg" />
      </View>
    </Screen>
  );
}

function FolderChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Button
      label={label}
      size="sm"
      variant={selected ? 'primary' : 'secondary'}
      onPress={onPress}
      style={{ paddingHorizontal: 14, borderColor: theme.colors.border }}
    />
  );
}
