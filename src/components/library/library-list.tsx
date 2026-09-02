import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FolderWithCount } from '@/lib/data/use-library';
import { formatUpdatedAt } from '@/lib/format-date';
import { useI18n } from '@/lib/i18n';
import type { Story } from '@/types/domain';

export type LibraryLayout = 'grid' | 'list';

export function LibraryList({
  folders,
  stories,
  layout,
  onFolderPress,
  onStoryPress,
  emptyTitle,
  emptySubtitle,
}: {
  folders: FolderWithCount[];
  stories: Story[];
  layout: LibraryLayout;
  onFolderPress: (folder: FolderWithCount) => void;
  onStoryPress: (story: Story) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}) {
  const { t, locale } = useI18n();

  if (folders.length === 0 && stories.length === 0) {
    return emptyTitle ? (
      <EmptyState
        icon={{ ios: 'folder', android: 'folder', web: 'folder' }}
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    ) : null;
  }

  return (
    <View style={[styles.wrap, layout === 'grid' && styles.grid]}>
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          layout={layout}
          storiesLabel={t('library.storiesCount')}
          onPress={() => onFolderPress(folder)}
        />
      ))}
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          layout={layout}
          updatedLabel={formatUpdatedAt(story.updatedAt, locale)}
          onPress={() => onStoryPress(story)}
        />
      ))}
    </View>
  );
}

function FolderCard({
  folder,
  layout,
  storiesLabel,
  onPress,
}: {
  folder: FolderWithCount;
  layout: LibraryLayout;
  storiesLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={layout === 'grid' && styles.gridItem}>
      {({ pressed }) => (
        <ThemedView type="backgroundElement" style={[styles.card, pressed && styles.pressed]}>
          <ThemedView type="backgroundSelected" style={styles.iconWrap}>
            <SymbolView name={{ ios: 'folder.fill', android: 'folder', web: 'folder' }} size={22} tintColor={theme.primary} />
          </ThemedView>
          <View style={styles.textWrap}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {folder.name}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {folder.storyCount} {storiesLabel}
            </ThemedText>
          </View>
        </ThemedView>
      )}
    </Pressable>
  );
}

function StoryCard({
  story,
  layout,
  updatedLabel,
  onPress,
}: {
  story: Story;
  layout: LibraryLayout;
  updatedLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={layout === 'grid' && styles.gridItem}>
      {({ pressed }) => (
        <ThemedView type="backgroundElement" style={[styles.card, pressed && styles.pressed]}>
          <ThemedView type="backgroundSelected" style={styles.iconWrap}>
            <SymbolView
              name={{ ios: 'play.rectangle.fill', android: 'video_library', web: 'video_library' }}
              size={22}
              tintColor={theme.primary}
            />
          </ThemedView>
          <View style={styles.textWrap}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {story.title}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {updatedLabel}
            </ThemedText>
          </View>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
