import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ShareSheet } from '@/components/story/share-sheet';
import { StoryPlayer } from '@/components/story/story-player';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { getStory } from '@/lib/data/stories';
import { listStoryTags } from '@/lib/data/tags';
import { useSlides } from '@/lib/data/use-slides';
import { useI18n } from '@/lib/i18n';
import type { Story, Tag } from '@/types/domain';

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();

  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showShare, setShowShare] = useState(false);
  useEffect(() => {
    if (!id) return;
    getStory(id)
      .then(setStory)
      .catch(() => setStory(null));
    listStoryTags(id)
      .then(setTags)
      .catch(() => setTags([]));
  }, [id]);

  const { slides, mediaById, loading } = useSlides(id);

  const finish = () => router.back();

  if (story === undefined || loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (story === null) {
    return (
      <View style={styles.centerScreen}>
        <Button label={t('common.retry')} variant="secondary" onPress={finish} />
      </View>
    );
  }

  const isOwner = story.createdBy === user?.id;

  return (
    <>
      <StoryPlayer
        story={story}
        slides={slides}
        mediaById={mediaById}
        tags={tags}
        isOwner={isOwner}
        onClose={finish}
        onEdit={isOwner ? () => router.push(`/story/${story.id}`) : undefined}
        onComment={user ? () => router.push(`/story/${story.id}/comments`) : undefined}
        onShare={isOwner ? () => setShowShare(true) : undefined}
        onTagPress={(tagName) => router.push(`/search?q=${encodeURIComponent(tagName)}`)}
      />
      {isOwner && user ? (
        <ShareSheet
          visible={showShare}
          onClose={() => setShowShare(false)}
          storyId={story.id}
          storyTitle={story.title}
          userId={user.id}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
