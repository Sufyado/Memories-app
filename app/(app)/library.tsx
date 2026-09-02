import React from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, IconButton, LoadingView, Text, useTheme } from '@/design-system';
import { useStories } from '@/features/stories/hooks';
import { StoryCard } from '@/features/stories/components/StoryCard';
import { useSettingsStore } from '@/store/settings';

export default function LibraryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const stories = useStories(undefined);
  const layout = useSettingsStore((s) => s.libraryLayout);
  const setLayout = useSettingsStore((s) => s.setLibraryLayout);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text variant="display" weight="bold">
          {t('library.title')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton
            accessibilityLabel={t('library.grid')}
            variant={layout === 'grid' ? 'solid' : 'ghost'}
            onPress={() => setLayout('grid')}
          >
            <Ionicons name="grid-outline" size={18} color={theme.colors.textPrimary} />
          </IconButton>
          <IconButton
            accessibilityLabel={t('library.list')}
            variant={layout === 'list' ? 'solid' : 'ghost'}
            onPress={() => setLayout('list')}
          >
            <Ionicons name="list-outline" size={18} color={theme.colors.textPrimary} />
          </IconButton>
        </View>
      </View>

      {stories.isLoading ? (
        <LoadingView />
      ) : stories.data && stories.data.length > 0 ? (
        <FlatList
          key={layout}
          data={stories.data}
          keyExtractor={(item) => item.id}
          numColumns={layout === 'grid' ? 2 : 1}
          columnWrapperStyle={layout === 'grid' ? { gap: 12 } : undefined}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
          refreshing={stories.isFetching}
          onRefresh={() => stories.refetch()}
          renderItem={({ item }) => (
            <View style={{ flex: layout === 'grid' ? 1 : undefined }}>
              <StoryCard story={item} layout={layout} onPress={() => router.push(`/story/${item.id}`)} />
            </View>
          )}
        />
      ) : (
        <EmptyState
          icon={<Ionicons name="albums-outline" size={40} color={theme.colors.brand} />}
          title={t('library.empty')}
          description={t('library.emptyDesc')}
          actionLabel={t('story.new')}
          onAction={() => router.push('/story/new')}
        />
      )}
    </SafeAreaView>
  );
}
