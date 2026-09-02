import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button, IconButton, Input, Text, useTheme } from '@/design-system';
import { MediaThumbnail } from '@/features/media/components/MediaThumbnail';
import { useDeleteMedia, useMediaMap, useUploadMedia } from '@/features/media/hooks';
import { pickFromCamera, pickFromLibrary } from '@/features/media/picker';
import type { SlideForm } from '../blocks';

type SlideEditorModalProps = {
  visible: boolean;
  storyId: string;
  slideId: string;
  initialForm: SlideForm;
  onSave: (form: SlideForm) => void;
  onCancel: () => void;
};

export function SlideEditorModal({ visible, onCancel, ...rest }: SlideEditorModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      {/* Mounted only while visible, so form state starts fresh from initialForm every time a
       * slide is opened — avoids syncing state from a prop via an effect. */}
      {visible ? <SlideEditorModalContent onCancel={onCancel} {...rest} /> : null}
    </Modal>
  );
}

function SlideEditorModalContent({
  storyId,
  slideId,
  initialForm,
  onSave,
  onCancel,
}: Omit<SlideEditorModalProps, 'visible'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [form, setForm] = useState<SlideForm>(initialForm);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const mediaMap = useMediaMap(storyId);
  const uploadMedia = useUploadMedia(storyId);
  const deleteMedia = useDeleteMedia(storyId);

  async function handlePickMedia(source: 'camera-photo' | 'camera-video' | 'library') {
    const asset =
      source === 'library'
        ? (await pickFromLibrary({ multiple: false }))[0]
        : await pickFromCamera(source === 'camera-video' ? 'video' : 'image');
    if (!asset) return;

    setUploadProgress(0);
    try {
      const media = await uploadMedia.mutateAsync({ slideId, asset, onProgress: setUploadProgress });
      setForm((f) => ({ ...f, mediaId: media.id }));
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : String(err));
    } finally {
      setUploadProgress(null);
    }
  }

  function chooseMediaSource() {
    Alert.alert(t('story.addSlides'), undefined, [
      { text: t('story.camera'), onPress: () => handlePickMedia('camera-photo') },
      { text: t('story.video'), onPress: () => handlePickMedia('camera-video') },
      { text: t('story.gallery'), onPress: () => handlePickMedia('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  function removeMedia() {
    if (form.mediaId) deleteMedia.mutate(form.mediaId);
    setForm((f) => ({ ...f, mediaId: null }));
  }

  const media = form.mediaId ? mediaMap[form.mediaId] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
          <Text variant="subtitle" weight="semibold">
            {t('story.slide')}
          </Text>
          <Button label={t('common.save')} onPress={() => onSave(form)} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Pressable
            onPress={form.mediaId ? undefined : chooseMediaSource}
            style={{
              height: 220,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              overflow: 'hidden',
              borderWidth: form.mediaId ? 0 : 1,
              borderStyle: 'dashed',
              borderColor: theme.colors.border,
            }}
          >
            {uploadProgress !== null ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <ActivityIndicator color={theme.colors.brand} />
                <Text variant="caption" color="secondary">
                  {Math.round(uploadProgress * 100)}%
                </Text>
              </View>
            ) : form.mediaId ? (
              <View style={{ flex: 1 }}>
                <MediaThumbnail media={media} radius={theme.radius.md} />
                <IconButton
                  accessibilityLabel={t('common.delete')}
                  variant="overlay"
                  onPress={removeMedia}
                  style={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </IconButton>
              </View>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="add-circle-outline" size={32} color={theme.colors.textMuted} />
                <Text variant="caption" color="secondary">
                  {t('story.addSlides')}
                </Text>
              </View>
            )}
          </Pressable>

          <Input
            label={t('story.title')}
            value={form.heading}
            onChangeText={(heading) => setForm((f) => ({ ...f, heading }))}
          />
          <Input
            label={t('story.description')}
            value={form.body}
            onChangeText={(body) => setForm((f) => ({ ...f, body }))}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
          />
          <Input
            label={t('story.viewerInfo')}
            placeholder="Caption"
            value={form.caption}
            onChangeText={(caption) => setForm((f) => ({ ...f, caption }))}
          />

          <OptionalBlocksEditor form={form} setForm={setForm} />
        </ScrollView>
      </View>
  );
}

function OptionalBlocksEditor({
  form,
  setForm,
}: {
  form: SlideForm;
  setForm: React.Dispatch<React.SetStateAction<SlideForm>>;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {!form.checklist ? (
          <Button
            size="sm"
            variant="secondary"
            label="+ Checklist"
            onPress={() => setForm((f) => ({ ...f, checklist: [{ text: '', done: false }] }))}
          />
        ) : null}
        {!form.warning ? (
          <Button size="sm" variant="secondary" label="+ Warning" onPress={() => setForm((f) => ({ ...f, warning: '' }))} />
        ) : null}
        {!form.quote ? (
          <Button
            size="sm"
            variant="secondary"
            label="+ Quote"
            onPress={() => setForm((f) => ({ ...f, quote: { text: '', author: '' } }))}
          />
        ) : null}
        {!form.link ? (
          <Button
            size="sm"
            variant="secondary"
            label="+ Link"
            onPress={() => setForm((f) => ({ ...f, link: { url: '', label: '' } }))}
          />
        ) : null}
      </View>

      {form.checklist ? (
        <BlockCard title="Checklist" onRemove={() => setForm((f) => ({ ...f, checklist: null }))}>
          {form.checklist.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable
                onPress={() =>
                  setForm((f) => ({
                    ...f,
                    checklist: f.checklist!.map((it, i) => (i === index ? { ...it, done: !it.done } : it)),
                  }))
                }
              >
                <Ionicons
                  name={item.done ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Input
                  value={item.text}
                  onChangeText={(text) =>
                    setForm((f) => ({ ...f, checklist: f.checklist!.map((it, i) => (i === index ? { ...it, text } : it)) }))
                  }
                  placeholder="Item"
                />
              </View>
              <IconButton
                accessibilityLabel={t('common.delete')}
                onPress={() => setForm((f) => ({ ...f, checklist: f.checklist!.filter((_, i) => i !== index) }))}
              >
                <Ionicons name="close" size={16} color={theme.colors.textMuted} />
              </IconButton>
            </View>
          ))}
          <Button
            size="sm"
            variant="ghost"
            label={`+ ${t('common.add')}`}
            onPress={() => setForm((f) => ({ ...f, checklist: [...(f.checklist ?? []), { text: '', done: false }] }))}
          />
        </BlockCard>
      ) : null}

      {form.warning !== null ? (
        <BlockCard title="Warning" onRemove={() => setForm((f) => ({ ...f, warning: null }))}>
          <Input value={form.warning} onChangeText={(warning) => setForm((f) => ({ ...f, warning }))} />
        </BlockCard>
      ) : null}

      {form.quote ? (
        <BlockCard title="Quote" onRemove={() => setForm((f) => ({ ...f, quote: null }))}>
          <Input
            value={form.quote.text}
            onChangeText={(text) => setForm((f) => ({ ...f, quote: { ...f.quote!, text } }))}
            placeholder="Quote"
          />
          <Input
            value={form.quote.author}
            onChangeText={(author) => setForm((f) => ({ ...f, quote: { ...f.quote!, author } }))}
            placeholder="Author"
          />
        </BlockCard>
      ) : null}

      {form.link ? (
        <BlockCard title="Link" onRemove={() => setForm((f) => ({ ...f, link: null }))}>
          <Input
            value={form.link.url}
            onChangeText={(url) => setForm((f) => ({ ...f, link: { ...f.link!, url } }))}
            placeholder="https://…"
            autoCapitalize="none"
          />
          <Input
            value={form.link.label}
            onChangeText={(label) => setForm((f) => ({ ...f, link: { ...f.link!, label } }))}
            placeholder="Label"
          />
        </BlockCard>
      ) : null}
    </View>
  );
}

function BlockCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" weight="semibold" color="secondary">
          {title}
        </Text>
        <IconButton accessibilityLabel="Remove" onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
        </IconButton>
      </View>
      {children}
    </View>
  );
}
