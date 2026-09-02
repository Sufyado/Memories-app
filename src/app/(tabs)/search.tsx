import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { LibraryList } from '@/components/library/library-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SignInPrompt } from '@/components/ui/sign-in-prompt';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { searchStories } from '@/lib/data/stories';
import { useI18n } from '@/lib/i18n';
import type { Story } from '@/types/domain';

const DEBOUNCE_MS = 350;

export default function SearchScreen() {
  const { t, isRTL } = useI18n();
  const theme = useTheme();
  const { user } = useAuth();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(q ?? '');
  const [results, setResults] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    setLoading(true);
    searchStories(trimmed)
      .then((rows) => {
        setResults(rows);
        setSearched(true);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!query.trim()) {
      // Clear results as soon as the query is emptied, not just on the next search.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    const timer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, user, runSearch]);

  if (!user) {
    return (
      <Screen title={t('search.title')}>
        <SignInPrompt title={t('library.signInTitle')} subtitle={t('library.signInSubtitle')} />
      </Screen>
    );
  }

  return (
    <Screen title={t('search.title')}>
      <ThemedView type="backgroundElement" style={styles.inputRow}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          tintColor={theme.textSecondary}
          size={16}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => runSearch(query)}
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
        />
      </ThemedView>

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <ThemedText type="small" themeColor="danger">
            {t('common.error')}
          </ThemedText>
          <Button label={t('common.retry')} variant="secondary" onPress={() => runSearch(query)} />
        </View>
      ) : searched ? (
        <LibraryList
          folders={[]}
          stories={results}
          layout="list"
          onFolderPress={() => {}}
          onStoryPress={(story) => router.push(`/story/${story.id}/view`)}
          emptyTitle={t('search.noResultsTitle')}
          emptySubtitle={t('search.noResultsSubtitle')}
        />
      ) : (
        <EmptyState
          icon={{ ios: 'sparkle.magnifyingglass', android: 'manage_search', web: 'manage_search' }}
          title={t('search.emptyTitle')}
          subtitle={t('search.emptySubtitle')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  spinner: {
    marginTop: Spacing.six,
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
});
