import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, View } from 'react-native';

import { StoryPlayer } from '@/components/story/story-player';
import { Spacing } from '@/constants/theme';
import { getStory } from '@/lib/data/stories';
import { getShareUrl, resolveShareSlug } from '@/lib/data/share-links';
import { listStoryTags } from '@/lib/data/tags';
import { useSlides } from '@/lib/data/use-slides';
import { useI18n } from '@/lib/i18n';
import type { ShareLink, Story, Tag } from '@/types/domain';

/**
 * The public Web Viewer — what opens when someone follows a
 * /s/<slug> share link. No account required: an active share_links row
 * is what grants read access (see the "stories select" RLS policy), not
 * being signed in.
 */
export default function PublicShareViewerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useI18n();

  const [shareLink, setShareLink] = useState<ShareLink | null | undefined>(undefined);
  const [story, setStory] = useState<Story | null | undefined>(undefined);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (!slug) return;
    resolveShareSlug(slug)
      .then((link) => {
        setShareLink(link);
        if (!link) {
          setStory(null);
          return;
        }
        getStory(link.storyId)
          .then(setStory)
          .catch(() => setStory(null));
        listStoryTags(link.storyId)
          .then(setTags)
          .catch(() => setTags([]));
      })
      .catch(() => {
        setShareLink(null);
        setStory(null);
      });
  }, [slug]);

  const { slides, mediaById, loading } = useSlides(story?.id);

  const finish = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleShare = async () => {
    if (!slug) return;
    const url = getShareUrl(slug);
    try {
      await Share.share({ message: url, url });
    } catch {
      // user cancelled or the platform has no share sheet — nothing to do
    }
  };

  if (shareLink === undefined || story === undefined || (story && loading)) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (shareLink === null || story === null) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.notFoundText}>{t('storyDetail.notFound')}</Text>
      </View>
    );
  }

  return (
    <StoryPlayer
      story={story}
      slides={slides}
      mediaById={mediaById}
      tags={tags}
      isOwner={false}
      onClose={finish}
      onShare={handleShare}
    />
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
  notFoundText: {
    color: '#fff',
    fontSize: 16,
  },
});
