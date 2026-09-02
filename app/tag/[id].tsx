import React from 'react';
import { FlatList } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, LoadingView, Screen } from '@/design-system';
import { useStoriesForTag, useTag } from '@/features/tags/hooks';
import { StoryCard } from '@/features/stories/components/StoryCard';

export default function TagResultsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const stories = useStoriesForTag(id);
  const tag = useTag(id);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: tag.data ? `#${tag.data.name}` : '' }} />
      <Screen padded={false}>
        {stories.isLoading ? (
          <LoadingView />
        ) : stories.data && stories.data.length > 0 ? (
          <FlatList
            data={stories.data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, gap: 12 }}
            renderItem={({ item }) => (
              <StoryCard story={item} layout="list" onPress={() => router.push(`/story/${item.id}`)} />
            )}
          />
        ) : (
          <EmptyState title={t('search.noResults', { query: tag.data?.name ?? '' })} />
        )}
      </Screen>
    </>
  );
}
