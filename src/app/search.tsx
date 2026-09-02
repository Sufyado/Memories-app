import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

export default function SearchScreen() {
  const { t, isRTL } = useI18n();
  const theme = useTheme();
  const [query, setQuery] = useState('');

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
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
        />
      </ThemedView>
      <EmptyState
        icon={{ ios: 'sparkle.magnifyingglass', android: 'manage_search', web: 'manage_search' }}
        title={t('search.emptyTitle')}
        subtitle={t('search.emptySubtitle')}
      />
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
});
