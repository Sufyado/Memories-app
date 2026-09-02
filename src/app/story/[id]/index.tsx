import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AddSlideButtons } from '@/components/story/add-slide-buttons';
import { SlideRow } from '@/components/story/slide-row';
import { TagChips } from '@/components/story/tag-chips';
import { TeamSection } from '@/components/story/team-section';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { deleteMedia } from '@/lib/data/media';
import { deleteSlide, duplicateSlide, updateSlideBlocks } from '@/lib/data/slides';
import { deleteStory, getStory, updateStory } from '@/lib/data/stories';
import { useSlides } from '@/lib/data/use-slides';
import { useStoryTags } from '@/lib/data/use-tags';
import { useI18n } from '@/lib/i18n';
import type { Story } from '@/types/domain';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const theme = useTheme();

  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { slides, mediaById, loading: slidesLoading, refresh: refreshSlides, move } = useSlides(story?.id);
  const { tags, add: addTag, remove: removeTag } = useStoryTags(story?.id);
  const [newTag, setNewTag] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const result = await getStory(id);
      setStory(result);
      setTitle(result?.title ?? '');
      setDescription(result?.description ?? '');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t('common.error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable enough for this dependency array
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loadError) {
    return (
      <Screen title="" showBackButton scroll={false}>
        <View style={styles.errorWrap}>
          <ThemedText type="small" themeColor="danger">
            {loadError}
          </ThemedText>
          <Button label={t('common.retry')} variant="secondary" onPress={load} />
        </View>
      </Screen>
    );
  }

  if (story === undefined) {
    return (
      <Screen title="" showBackButton scroll={false}>
        <ActivityIndicator style={styles.spinner} />
      </Screen>
    );
  }

  if (story === null) {
    return (
      <Screen title={t('storyDetail.notFound')} showBackButton scroll={false}>
        <View />
      </Screen>
    );
  }

  const isOwner = story.createdBy === user?.id;
  const isDirty = title.trim() !== story.title || (description || null) !== story.description;

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const updated = await updateStory(story.id, user.id, {
        title: title.trim(),
        description: description.trim() || null,
      });
      setStory(updated);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('storyDetail.deleteConfirmTitle'), t('storyDetail.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteStory(story.id);
            router.back();
          } catch (e) {
            setDeleting(false);
            Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
          }
        },
      },
    ]);
  };

  const handleCaptionChange = async (slideId: string, text: string) => {
    try {
      await updateSlideBlocks(slideId, text ? [{ id: 'heading', type: 'heading', text }] : []);
      refreshSlides();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    }
  };

  const handleDuplicateSlide = async (slideId: string) => {
    const slide = slides.find((s) => s.id === slideId);
    if (!slide) return;
    try {
      await duplicateSlide(slide, slides.length);
      refreshSlides();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    }
  };

  const handleDeleteSlide = (slideId: string) => {
    Alert.alert(t('storyDetail.deleteSlideConfirmTitle'), t('storyDetail.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const media = mediaById[slides.find((s) => s.id === slideId)?.mediaId ?? ''];
            await deleteSlide(slideId);
            if (media) await deleteMedia(media);
            refreshSlides();
          } catch (e) {
            Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
          }
        },
      },
    ]);
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const value = newTag.trim();
    setNewTag('');
    try {
      await addTag(value);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <Screen
      title={story.title}
      showBackButton
      headerRight={
        slides.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/story/${story.id}/view`)}>
            <ThemedView type="backgroundElement" style={styles.previewButton}>
              <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={16} tintColor={theme.primary} />
            </ThemedView>
          </Pressable>
        ) : undefined
      }>
      <Input value={title} onChangeText={setTitle} editable={isOwner} placeholder={t('newStory.titlePlaceholder')} />
      <Input
        value={description}
        onChangeText={setDescription}
        editable={isOwner}
        placeholder={t('storyDetail.descriptionPlaceholder')}
        multiline
      />
      {isOwner && isDirty ? (
        <Button label={t('common.save')} onPress={handleSave} disabled={saving || !title.trim()} />
      ) : null}

      <View style={styles.slidesSection}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('storyDetail.slidesTitle')}
        </ThemedText>

        {slidesLoading ? (
          <ActivityIndicator />
        ) : slides.length === 0 ? (
          <EmptyState
            icon={{ ios: 'rectangle.stack.badge.plus', android: 'add_to_photos', web: 'add_to_photos' }}
            title={t('storyDetail.noSlidesTitle')}
            subtitle={t('storyDetail.noSlidesSubtitle')}
          />
        ) : (
          <View style={styles.slideList}>
            {slides.map((slide, index) => (
              <SlideRow
                key={slide.id}
                slide={slide}
                media={slide.mediaId ? mediaById[slide.mediaId] : undefined}
                canMoveUp={index > 0}
                canMoveDown={index < slides.length - 1}
                onMoveUp={() => move(index, -1)}
                onMoveDown={() => move(index, 1)}
                onDuplicate={() => handleDuplicateSlide(slide.id)}
                onDelete={() => handleDeleteSlide(slide.id)}
                onCaptionChange={(text) => handleCaptionChange(slide.id, text)}
              />
            ))}
          </View>
        )}

        {isOwner ? (
          <AddSlideButtons storyId={story.id} nextOrderIndex={slides.length} onAdded={refreshSlides} />
        ) : null}
      </View>

      <View style={styles.tagsSection}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('storyDetail.tagsTitle')}
        </ThemedText>
        <TagChips tags={tags} onRemove={isOwner ? (tag) => removeTag(tag.id) : undefined} />
        {isOwner ? (
          <View style={styles.tagInputRow}>
            <View style={styles.tagInputField}>
              <Input
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
                placeholder={t('storyDetail.tagPlaceholder')}
              />
            </View>
            <Button label={t('common.save')} variant="secondary" onPress={handleAddTag} disabled={!newTag.trim()} />
          </View>
        ) : null}
      </View>

      {isOwner ? <TeamSection storyId={story.id} /> : null}

      {isOwner ? (
        <Button
          label={t('storyDetail.deleteStory')}
          variant="secondary"
          onPress={handleDelete}
          disabled={deleting}
          style={styles.deleteButton}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginTop: Spacing.six,
  },
  tagsSection: {
    gap: Spacing.two,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tagInputField: {
    flex: 1,
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
  slidesSection: {
    gap: Spacing.three,
  },
  slideList: {
    gap: Spacing.one,
  },
  deleteButton: {
    marginTop: Spacing.four,
  },
});
