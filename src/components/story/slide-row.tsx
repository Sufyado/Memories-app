import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSignedUrl } from '@/lib/data/use-signed-url';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';
import type { Media, StorySlide } from '@/types/domain';

export function SlideRow({
  slide,
  media,
  onMoveUp,
  onMoveDown,
  onDelete,
  onCaptionChange,
  canMoveUp,
  canMoveDown,
}: {
  slide: StorySlide;
  media: Media | undefined;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onCaptionChange: (text: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const theme = useTheme();
  const { t, isRTL } = useI18n();
  const thumbnailPath = media ? (media.type === 'video' ? media.thumbnailPath : media.storagePath) : null;
  const thumbnailUrl = useSignedUrl(thumbnailPath);
  const initialCaption = slide.blocks.find((b) => b.type === 'heading' || b.type === 'body')?.text ?? '';
  const [caption, setCaption] = useState(initialCaption);

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.thumbnailWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <ThemedView type="backgroundSelected" style={styles.thumbnailPlaceholder}>
            <SymbolView
              name={{ ios: 'photo', android: 'image', web: 'image' }}
              size={18}
              tintColor={theme.textSecondary}
            />
          </ThemedView>
        )}
        {media?.type === 'video' ? (
          <View style={styles.playBadge}>
            <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={10} tintColor="#fff" />
          </View>
        ) : null}
      </View>

      <TextInput
        value={caption}
        onChangeText={setCaption}
        onEndEditing={() => {
          if (caption !== initialCaption) onCaptionChange(caption);
        }}
        placeholder={t('storyDetail.slideCaptionPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        style={[styles.textWrap, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
      />

      <View style={styles.actions}>
        <IconButton
          icon={{ ios: 'chevron.up', android: 'arrow_upward', web: 'arrow_upward' }}
          disabled={!canMoveUp}
          onPress={onMoveUp}
        />
        <IconButton
          icon={{ ios: 'chevron.down', android: 'arrow_downward', web: 'arrow_downward' }}
          disabled={!canMoveDown}
          onPress={onMoveDown}
        />
        <IconButton
          icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
          onPress={onDelete}
          tintColor={theme.danger}
        />
      </View>
    </ThemedView>
  );
}

function IconButton({
  icon,
  onPress,
  disabled,
  tintColor,
}: {
  icon: Parameters<typeof SymbolView>[0]['name'];
  onPress: () => void;
  disabled?: boolean;
  tintColor?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={styles.iconButton}>
      <SymbolView name={icon} size={16} tintColor={disabled ? theme.border : (tintColor ?? theme.textSecondary)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  thumbnailWrap: {
    width: 44,
    height: 44,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    position: 'absolute',
    bottom: 2,
    insetInlineEnd: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  iconButton: {
    padding: Spacing.one,
  },
});
