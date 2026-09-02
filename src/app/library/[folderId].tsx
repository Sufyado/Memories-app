import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LayoutToggle } from '@/components/library/layout-toggle';
import { LibraryList, type LibraryLayout } from '@/components/library/library-list';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { getFolder } from '@/lib/data/folders';
import { useLibrary, type FolderWithCount } from '@/lib/data/use-library';
import { useI18n } from '@/lib/i18n';
import type { Folder, Story } from '@/types/domain';

export default function FolderScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const { t } = useI18n();
  const [layout, setLayout] = useState<LibraryLayout>('grid');
  const [folder, setFolder] = useState<Folder | null>(null);
  const { folders, stories, loading, error, refresh } = useLibrary(folderId ?? null);

  useEffect(() => {
    // Folder metadata (just the title) is secondary to the folders/stories
    // list below, which has its own error + retry UI via useLibrary — so a
    // failure here is swallowed rather than duplicating that error state.
    if (folderId) getFolder(folderId).then(setFolder).catch(() => {});
  }, [folderId]);

  const handleFolderPress = (child: FolderWithCount) => router.push(`/library/${child.id}`);
  const handleStoryPress = (story: Story) => router.push(`/story/${story.id}`);

  return (
    <Screen
      title={folder?.name ?? ''}
      showBackButton
      headerRight={<LayoutToggle layout={layout} onChange={setLayout} />}>
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
