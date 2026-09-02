import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Chip, EmptyState, Input, LoadingView, Text, useTheme } from '@/design-system';
import { useSearchStories } from '@/features/search/hooks';
import { useTags } from '@/features/tags/hooks';
import { StoryCard } from '@/features/stories/components/StoryCard';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);

  const results = useSearchStories(debounced);
  const tags = useTags();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        <Text variant="display" weight="bold">
          {t('nav.search')}
        </Text>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {debounced.trim().length === 0 ? (
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <Text variant="label" weight="semibold" color="secondary">
            {t('search.recentTags')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tags.data?.map((tag) => (
              <Chip key={tag.id} label={`#${tag.name}`} onPress={() => router.push(`/tag/${tag.id}`)} />
            ))}
          </View>
        </View>
      ) : results.isLoading ? (
        <LoadingView />
      ) : results.data && results.data.length > 0 ? (
        <FlatList
          data={results.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <StoryCard story={item} layout="list" onPress={() => router.push(`/story/${item.id}`)} />
          )}
        />
      ) : (
        <EmptyState
          icon={<Ionicons name="search-outline" size={36} color={theme.colors.textMuted} />}
          title={t('search.noResults', { query: debounced })}
        />
      )}
    </SafeAreaView>
  );
}
