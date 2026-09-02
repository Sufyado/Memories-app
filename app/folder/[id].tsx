import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EmptyState, IconButton, LoadingView, PromptModal, Screen, Text, useTheme } from '@/design-system';
import { useDeleteFolder, useFolder, useFolders, useRenameFolder } from '@/features/folders/hooks';
import { FolderCard } from '@/features/folders/components/FolderCard';
import { useStories } from '@/features/stories/hooks';
import { StoryCard } from '@/features/stories/components/StoryCard';
import { useSettingsStore } from '@/store/settings';

export default function FolderScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const folder = useFolder(id);
  const subfolders = useFolders(id);
  const stories = useStories(id);
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();
  const layout = useSettingsStore((s) => s.libraryLayout);

  const [renaming, setRenaming] = useState(false);

  if (folder.isLoading) return <LoadingView />;
  if (!folder.data) return null;

  function confirmDelete() {
    Alert.alert(t('folder.deleteConfirmTitle'), t('folder.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteFolder.mutate(id, { onSuccess: () => router.back() });
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: folder.data.name,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <IconButton accessibilityLabel={t('common.edit')} onPress={() => setRenaming(true)}>
                <Ionicons name="pencil-outline" size={18} color={theme.colors.textPrimary} />
              </IconButton>
              <IconButton accessibilityLabel={t('common.delete')} onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
              </IconButton>
            </View>
          ),
        }}
      />
      <Screen scroll>
        <View style={{ gap: 24, paddingTop: 12 }}>
          {subfolders.data && subfolders.data.length > 0 ? (
            <View style={{ gap: 12 }}>
              <Text variant="title" weight="semibold">
                {t('nav.library')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {subfolders.data.map((sub) => (
                  <View key={sub.id} style={{ width: '31%' }}>
                    <FolderCard folder={sub} onPress={() => router.push(`/folder/${sub.id}`)} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <Text variant="title" weight="semibold">
              {t('story.section')}
            </Text>
            {stories.data && stories.data.length > 0 ? (
              <View style={layout === 'grid' ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } : { gap: 12 }}>
                {stories.data.map((story) => (
                  <View key={story.id} style={layout === 'grid' ? { width: '48%' } : undefined}>
                    <StoryCard story={story} layout={layout} onPress={() => router.push(`/story/${story.id}`)} />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                title={t('folder.empty')}
                description={t('folder.emptyDesc')}
                actionLabel={t('story.new')}
                onAction={() => router.push({ pathname: '/story/new', params: { folderId: id } })}
              />
            )}
          </View>
        </View>
      </Screen>

      <PromptModal
        visible={renaming}
        title={t('common.edit')}
        initialValue={folder.data.name}
        onClose={() => setRenaming(false)}
        onSubmit={(name) => {
          renameFolder.mutate({ id, name });
          setRenaming(false);
        }}
      />
    </>
  );
}
