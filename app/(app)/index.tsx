import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { EmptyState, IconButton, PromptModal, Screen, Text, useTheme } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRecentStories } from '@/features/stories/hooks';
import { StoryCard } from '@/features/stories/components/StoryCard';
import { useCreateFolder, useFolders } from '@/features/folders/hooks';
import { FolderCard } from '@/features/folders/components/FolderCard';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const recentStories = useRecentStories(8);
  const folders = useFolders(null);
  const createFolder = useCreateFolder();
  const [newFolderVisible, setNewFolderVisible] = useState(false);

  const displayName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? '';
  const isEmpty = !recentStories.isLoading && !folders.isLoading && recentStories.data?.length === 0 && folders.data?.length === 0;

  return (
    <Screen
      scroll
      onRefresh={() => {
        recentStories.refetch();
        folders.refetch();
      }}
      refreshing={recentStories.isFetching || folders.isFetching}
    >
      <View style={{ paddingTop: 12, paddingBottom: 20, gap: 4 }}>
        <Text variant="display" weight="bold">
          {displayName ? `👋 ${displayName}` : 'Vistoria'}
        </Text>
        <Text variant="body" color="secondary">
          {t('auth.tagline')}
        </Text>
      </View>

      {isEmpty ? (
        <EmptyState
          icon={<Ionicons name="sparkles-outline" size={40} color={theme.colors.brand} />}
          title={t('library.empty')}
          description={t('library.emptyDesc')}
          actionLabel={t('story.new')}
          onAction={() => router.push('/story/new')}
        />
      ) : (
        <View style={{ gap: 28 }}>
          {recentStories.data && recentStories.data.length > 0 ? (
            <View style={{ gap: 12 }}>
              <SectionHeader title={t('nav.home')} />
              <FlatList
                data={recentStories.data}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                  <View style={{ width: 150 }}>
                    <StoryCard story={item} layout="grid" onPress={() => router.push(`/story/${item.id}`)} />
                  </View>
                )}
              />
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="title" weight="semibold">
                {t('library.title')}
              </Text>
              <IconButton accessibilityLabel={t('folder.new')} onPress={() => setNewFolderVisible(true)}>
                <Ionicons name="add" size={22} color={theme.colors.textPrimary} />
              </IconButton>
            </View>
            {folders.data && folders.data.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {folders.data.map((folder) => (
                  <View key={folder.id} style={{ width: '31%' }}>
                    <FolderCard folder={folder} onPress={() => router.push(`/folder/${folder.id}`)} />
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="body" color="secondary">
                {t('folder.empty')}
              </Text>
            )}
          </View>
        </View>
      )}

      <PromptModal
        visible={newFolderVisible}
        title={t('folder.new')}
        placeholder={t('folder.name')}
        onClose={() => setNewFolderVisible(false)}
        onSubmit={(name) => {
          createFolder.mutate({ name });
          setNewFolderVisible(false);
        }}
      />
    </Screen>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text variant="title" weight="semibold">
      {title}
    </Text>
  );
}
