import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { LibraryList } from '@/components/library/library-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SignInPrompt } from '@/components/ui/sign-in-prompt';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { useHomeData } from '@/lib/data/use-home';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';
import type { FolderWithCount } from '@/lib/data/use-library';
import type { Story } from '@/types/domain';

export default function HomeScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const { user } = useAuth();
  const { collections, recentStories, loading, error, refresh } = useHomeData();

  const addButton = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/create')}
      style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.addButtonInner}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={theme.text} size={20} />
      </ThemedView>
    </Pressable>
  );

  if (!user) {
    return (
      <Screen title={t('home.title')} headerRight={addButton}>
        <SignInPrompt title={t('home.signInTitle')} subtitle={t('home.signInSubtitle')} />
      </Screen>
    );
  }

  const handleFolderPress = (folder: FolderWithCount) => router.push(`/library/${folder.id}`);
  const handleStoryPress = (story: Story) => router.push(`/story/${story.id}`);

  const isEmpty = collections.length === 0 && recentStories.length === 0;

  return (
    <Screen title={t('home.title')} headerRight={addButton}>
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <ThemedText type="small" themeColor="danger">
            {t('common.error')}
          </ThemedText>
          <Button label={t('common.retry')} variant="secondary" onPress={refresh} />
        </View>
      ) : isEmpty ? (
        <EmptyState
          icon={{ ios: 'photo.on.rectangle.angled', android: 'photo_library', web: 'photo_library' }}
          title={t('home.emptyTitle')}
          subtitle={t('home.emptySubtitle')}
        />
      ) : (
        <View style={styles.sections}>
          {recentStories.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('home.recentStories')}
              </ThemedText>
              <LibraryList
                folders={[]}
                stories={recentStories}
                layout="list"
                onFolderPress={handleFolderPress}
                onStoryPress={handleStoryPress}
              />
            </View>
          ) : null}
          {collections.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('home.collections')}
              </ThemedText>
              <LibraryList
                folders={collections}
                stories={[]}
                layout="grid"
                onFolderPress={handleFolderPress}
                onStoryPress={handleStoryPress}
              />
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderRadius: Spacing.five,
  },
  addButtonInner: {
    width: 40,
    height: 40,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  spinner: {
    marginTop: Spacing.six,
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
  sections: {
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.two,
  },
});
