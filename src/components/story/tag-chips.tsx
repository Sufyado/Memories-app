import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Tag } from '@/types/domain';

export function TagChips({
  tags,
  onPress,
  onRemove,
}: {
  tags: Tag[];
  /** Tapping the tag's label — e.g. to jump into search. Omit to make chips non-interactive. */
  onPress?: (tag: Tag) => void;
  /** Shows a remove (×) button per chip — e.g. in the editor. Omit to hide it. */
  onRemove?: (tag: Tag) => void;
}) {
  if (tags.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} onPress={onPress} onRemove={onRemove} />
      ))}
    </View>
  );
}

function TagChip({
  tag,
  onPress,
  onRemove,
}: {
  tag: Tag;
  onPress?: (tag: Tag) => void;
  onRemove?: (tag: Tag) => void;
}) {
  const theme = useTheme();
  const content = (
    <ThemedView type="backgroundElement" style={styles.chip}>
      <ThemedText type="caption">#{tag.name}</ThemedText>
      {onRemove ? (
        <Pressable accessibilityRole="button" onPress={() => onRemove(tag)} hitSlop={8}>
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={11} tintColor={theme.textSecondary} />
        </Pressable>
      ) : null}
    </ThemedView>
  );

  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(tag)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
  },
});
