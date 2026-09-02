import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createSlide } from '@/lib/data/slides';
import { uploadMedia } from '@/lib/data/media';
import { generateVideoThumbnail } from '@/lib/media/generate-thumbnail';
import { captureFromCamera, pickFromLibrary, type PickedMedia } from '@/lib/media/pick-media';
import { useI18n } from '@/lib/i18n';

export function AddSlideButtons({
  storyId,
  nextOrderIndex,
  onAdded,
}: {
  storyId: string;
  nextOrderIndex: number;
  onAdded: () => void;
}) {
  const { t } = useI18n();
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [addingText, setAddingText] = useState(false);
  const [textValue, setTextValue] = useState('');

  const handlePicked = async (picked: PickedMedia | null) => {
    if (!picked) return;
    setBusy(true);
    try {
      const thumbnailLocalUri = picked.type === 'video' ? await generateVideoThumbnail(picked.uri) : null;
      const media = await uploadMedia({
        storyId,
        type: picked.type,
        localUri: picked.uri,
        mimeType: picked.mimeType,
        width: picked.width,
        height: picked.height,
        durationMs: picked.durationMs,
        thumbnailLocalUri,
      });
      await createSlide({ storyId, orderIndex: nextOrderIndex, blocks: [], mediaId: media.id, mediaType: media.type as 'image' | 'video' });
      onAdded();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleAddText = async () => {
    if (!textValue.trim()) return;
    setBusy(true);
    try {
      await createSlide({
        storyId,
        orderIndex: nextOrderIndex,
        blocks: [{ id: 'heading', type: 'heading', text: textValue.trim() }],
      });
      setTextValue('');
      setAddingText(false);
      onAdded();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <View style={styles.busyRow}>
        <ActivityIndicator />
        <ThemedText type="small" themeColor="textSecondary">
          {t('storyDetail.uploading')}
        </ThemedText>
      </View>
    );
  }

  if (addingText) {
    return (
      <View style={styles.textForm}>
        <Input value={textValue} onChangeText={setTextValue} placeholder={t('storyDetail.slideTextPlaceholder')} autoFocus />
        <View style={styles.textFormActions}>
          <Button label={t('common.cancel')} variant="ghost" onPress={() => setAddingText(false)} />
          <Button label={t('common.save')} onPress={handleAddText} disabled={!textValue.trim()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <ActionButton
        icon={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
        label={t('storyDetail.addCamera')}
        onPress={async () => handlePicked(await captureFromCamera('images'))}
      />
      <ActionButton
        icon={{ ios: 'video', android: 'videocam', web: 'videocam' }}
        label={t('storyDetail.addVideo')}
        onPress={async () => handlePicked(await captureFromCamera('videos'))}
      />
      <ActionButton
        icon={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
        label={t('storyDetail.addGallery')}
        onPress={async () => handlePicked(await pickFromLibrary())}
      />
      <ActionButton
        icon={{ ios: 'textformat', android: 'text_fields', web: 'text_fields' }}
        label={t('storyDetail.addText')}
        onPress={() => setAddingText(true)}
      />
    </View>
  );

  function ActionButton({
    icon,
    label,
    onPress,
  }: {
    icon: Parameters<typeof SymbolView>[0]['name'];
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionButton}>
        <ThemedView type="backgroundElement" style={styles.actionIconWrap}>
          <SymbolView name={icon} size={18} tintColor={theme.primary} />
        </ThemedView>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  textForm: {
    gap: Spacing.two,
  },
  textFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});
