import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { deleteStory, getStory, updateStory } from '@/lib/data/stories';
import { useI18n } from '@/lib/i18n';
import type { Story } from '@/types/domain';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();

  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <Screen title={story.title} showBackButton>
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

      <EmptyState
        icon={{ ios: 'rectangle.stack.badge.plus', android: 'add_to_photos', web: 'add_to_photos' }}
        title={t('storyDetail.noSlidesTitle')}
        subtitle={t('storyDetail.noSlidesSubtitle')}
      />

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
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
  },
  deleteButton: {
    marginTop: Spacing.four,
  },
});
