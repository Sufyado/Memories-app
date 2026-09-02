import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import DraggableFlatList, { type RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { Button, Card, IconButton, LoadingView, PromptModal, Screen, Text, useTheme } from '@/design-system';
import { useStory, useUpdateStoryMeta, usePublishStoryVersion } from '@/features/stories/hooks';
import { useCreateSlide, useDeleteSlide, useDuplicateSlide, useReorderSlides, useSlides, useUpdateSlideBlocks } from '@/features/slides/hooks';
import { useMediaMap } from '@/features/media/hooks';
import { MediaThumbnail } from '@/features/media/components/MediaThumbnail';
import { blocksToForm, emptySlideForm, formToBlocks, isSlideFormEmpty, type SlideForm } from '@/features/slides/blocks';
import { SlideEditorModal } from '@/features/slides/components/SlideEditorModal';
import { parseSlideBlocks, type StorySlide } from '@/types/domain';
import type { Json } from '@/types/database';

export default function StoryEditScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const story = useStory(id);
  const slidesQuery = useSlides(id);
  const mediaMap = useMediaMap(id);
  const updateStoryMeta = useUpdateStoryMeta();
  const publishVersion = usePublishStoryVersion();
  const createSlide = useCreateSlide(id);
  const updateSlideBlocks = useUpdateSlideBlocks(id);
  const duplicateSlide = useDuplicateSlide(id);
  const deleteSlide = useDeleteSlide(id);
  const reorderSlides = useReorderSlides(id);

  const slides = (slidesQuery.data ?? []).map(parseSlideBlocks);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const editingSlide = slides.find((s) => s.id === editingSlideId);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  async function addSlide() {
    const created = await createSlide.mutateAsync({ position: slides.length });
    setEditingSlideId(created.id);
  }

  function openSlide(slide: StorySlide) {
    setEditingSlideId(slide.id);
  }

  async function handleSaveSlide(form: SlideForm) {
    if (!editingSlideId) return;
    await updateSlideBlocks.mutateAsync({ slideId: editingSlideId, blocks: formToBlocks(form) });
    setEditingSlideId(null);
  }

  async function handleCancelSlide() {
    const slide = editingSlide;
    setEditingSlideId(null);
    if (slide && slide.blocks.length === 0) {
      await deleteSlide.mutateAsync(slide.id);
    }
  }

  function confirmDeleteSlide(slideId: string) {
    Alert.alert(t('story.deleteSlideConfirmTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteSlide.mutate(slideId) },
    ]);
  }

  async function onDone() {
    setSaving(true);
    try {
      const snapshot: Json = {
        title: story.data?.title ?? null,
        description: story.data?.description ?? null,
        slides: slides.map((s) => ({
          id: s.id,
          position: s.position,
          blocks: s.blocks as unknown as Json,
          event_date: s.event_date,
        })),
      };
      await publishVersion.mutateAsync({ id, snapshot });
      router.replace(`/story/${id}`);
    } finally {
      setSaving(false);
    }
  }

  if (story.isLoading) return <LoadingView />;
  if (!story.data) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('story.editStory'),
          headerRight: () => <Button label={t('common.done')} onPress={onDone} loading={saving} size="sm" />,
        }}
      />
      <Screen padded={false}>
        <View style={{ padding: 20, gap: 4 }}>
          <Text variant="title" weight="bold" onPress={() => setEditingTitle(true)}>
            {story.data.title || t('common.untitled')}
          </Text>
          <Text variant="caption" color="secondary">
            {t('story.reorderHint')}
          </Text>
        </View>

        <DraggableFlatList
          data={slides}
          keyExtractor={(item) => item.id}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
          onDragEnd={({ data }) => reorderSlides.mutate(data.map((s) => s.id))}
          ListEmptyComponent={
            <Text variant="body" color="secondary">
              {t('folder.empty')}
            </Text>
          }
          renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<StorySlide>) => {
            const form = blocksToForm(item.blocks);
            const mediaBlock = item.blocks.find((b) => b.type === 'media');
            const media = mediaBlock?.type === 'media' ? mediaMap[mediaBlock.mediaId] : undefined;
            const index = getIndex() ?? 0;

            return (
              <ScaleDecorator>
                <Card style={{ opacity: isActive ? 0.85 : 1, flexDirection: 'row', padding: 10, gap: 10, alignItems: 'center' }}>
                  <Text variant="caption" color="muted" style={{ width: 20 }}>
                    {index + 1}
                  </Text>
                  <Card onPress={() => openSlide(item)} style={{ width: 52, height: 52 }}>
                    <MediaThumbnail media={media} />
                  </Card>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="semibold" numberOfLines={1} onPress={() => openSlide(item)}>
                      {form.heading || form.body || t('story.slide')}
                    </Text>
                  </View>
                  <IconButton
                    accessibilityLabel={t('story.duplicate')}
                    onPress={() => duplicateSlide.mutate({ slide: item, newPosition: slides.length })}
                  >
                    <Ionicons name="copy-outline" size={18} color={theme.colors.textSecondary} />
                  </IconButton>
                  <IconButton accessibilityLabel={t('common.delete')} onPress={() => confirmDeleteSlide(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                  </IconButton>
                  <IconButton accessibilityLabel={t('story.reorderHint')} onLongPress={drag} onPressIn={drag}>
                    <Ionicons name="reorder-three-outline" size={22} color={theme.colors.textMuted} />
                  </IconButton>
                </Card>
              </ScaleDecorator>
            );
          }}
        />

        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
          <Button label={t('story.addSlide')} onPress={addSlide} fullWidth size="lg" loading={createSlide.isPending} />
        </View>
      </Screen>

      {editingSlideId ? (
        <SlideEditorModal
          visible
          storyId={id}
          slideId={editingSlideId}
          initialForm={editingSlide ? blocksToForm(editingSlide.blocks) : emptySlideForm()}
          onSave={handleSaveSlide}
          onCancel={handleCancelSlide}
        />
      ) : null}

      <PromptModal
        visible={editingTitle}
        title={t('story.title')}
        initialValue={story.data.title}
        onClose={() => setEditingTitle(false)}
        onSubmit={(title) => {
          updateStoryMeta.mutate({ id, patch: { title } });
          setEditingTitle(false);
        }}
      />
    </>
  );
}
