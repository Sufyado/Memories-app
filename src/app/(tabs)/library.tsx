import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LayoutToggle } from '@/components/library/layout-toggle';
import { LibraryList, type LibraryLayout } from '@/components/library/library-list';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SignInPrompt } from '@/components/ui/sign-in-prompt';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { useLibrary, type FolderWithCount } from '@/lib/data/use-library';
import { useI18n } from '@/lib/i18n';
import type { Story } from '@/types/domain';

export default function LibraryScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [layout, setLayout] = useState<LibraryLayout>('grid');
  const { folders, stories, loading, error, refresh } = useLibrary(null);

  if (!user) {
    return (
      <Screen title={t('library.title')}>
        <SignInPrompt title={t('library.signInTitle')} subtitle={t('library.signInSubtitle')} />
      </Screen>
    );
  }

  const handleFolderPress = (folder: FolderWithCount) => router.push(`/library/${folder.id}`);
  const handleStoryPress = (story: Story) => router.push(`/story/${story.id}/view`);

  return (
    <Screen title={t('library.title')} headerRight={<LayoutToggle layout={layout} onChange={setLayout} />}>
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <ThemedText type="small" themeColor="danger">
            {t('common.error')}
          </ThemedText>
          <Button label={t('common.retry')} variant="secondary" onPress={refresh} />
        </View>
      ) : (
        <LibraryList
          folders={folders}
          stories={stories}
          layout={layout}
          onFolderPress={handleFolderPress}
          onStoryPress={handleStoryPress}
          emptyTitle={t('library.emptyTitle')}
          emptySubtitle={t('library.emptySubtitle')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginTop: Spacing.six,
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
});
