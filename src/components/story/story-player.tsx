import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

import { StoryProgressBar } from '@/components/story/progress-bar';
import { Spacing } from '@/constants/theme';
import { useSignedUrl } from '@/lib/data/use-signed-url';
import { useI18n } from '@/lib/i18n';
import type { Media, Story, StorySlide, Tag } from '@/types/domain';

const IMAGE_SLIDE_DURATION_MS = 5000;

export type StoryPlayerProps = {
  story: Story;
  slides: StorySlide[];
  mediaById: Record<string, Media>;
  tags: Tag[];
  isOwner: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onTagPress?: (tagName: string) => void;
};

/**
 * The full-screen, Instagram/Snapchat-style slide player. Shared by the
 * authenticated Story Viewer (src/app/story/[id]/view.tsx) and the public
 * Web Viewer (src/app/s/[slug].tsx) — the two differ only in how they
 * load the story and which actions are available (an anonymous public
 * viewer gets no Edit/Comment, for instance), which is exactly what the
 * optional props above express.
 */
export function StoryPlayer({
  story,
  slides,
  mediaById,
  tags,
  isOwner,
  onClose,
  onEdit,
  onComment,
  onShare,
  onTagPress,
}: StoryPlayerProps) {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const slide = slides[index];
  const media = slide?.mediaId ? mediaById[slide.mediaId] : undefined;
  const isVideo = media?.type === 'video';
  const mediaUrl = useSignedUrl(media?.storagePath);
  const videoUrl = isVideo ? mediaUrl : null;
  const caption = slide?.blocks.find((b) => b.type === 'heading' || b.type === 'body')?.text;

  const goNext = () => {
    setIndex((i) => {
      if (i + 1 >= slides.length) {
        onClose();
        return i;
      }
      return i + 1;
    });
  };
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    // Reset per-slide UI state whenever the slide changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    setShowInfo(false);
  }, [index]);

  // Auto-advance timer for image/text slides.
  useEffect(() => {
    if (isVideo || paused || !slide) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / IMAGE_SLIDE_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        clearInterval(timer);
        goNext();
      }
    }, 50);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goNext/slide identity churns every render; index is the real key
  }, [index, isVideo, paused]);

  const player = useVideoPlayer(videoUrl ?? null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (!isVideo) return;
    if (paused) player.pause();
    else player.play();
  }, [isVideo, paused, player]);

  useEffect(() => {
    if (!isVideo) return;
    const sub = player.addListener('playToEnd', goNext);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goNext churns every render; index is the real key
  }, [isVideo, player, index]);

  useEffect(() => {
    if (!isVideo) return;
    const poll = setInterval(() => {
      if (player.duration > 0) setProgress(Math.min(1, player.currentTime / player.duration));
    }, 100);
    return () => clearInterval(poll);
  }, [isVideo, player, index]);

  if (slides.length === 0) {
    return (
      <View style={[styles.centerScreen, { paddingTop: insets.top }]}>
        <CloseButton onPress={onClose} isRTL={isRTL} />
        <Text style={[styles.overlayTextSubtitle, styles.emptyTitle]}>{t('viewer.noSlidesTitle')}</Text>
        {onEdit ? (
          <Pressable accessibilityRole="button" onPress={onEdit}>
            <Text style={styles.overlayTextSmallBold}>{t('viewer.noSlidesEdit')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Pressable style={styles.tapZoneLeft} onPress={goPrev} />
      <Pressable style={styles.tapZoneRight} onPress={goNext} />
      <Pressable style={styles.tapZoneCenter} onPress={() => setPaused((p) => !p)} />

      {media ? (
        isVideo ? (
          <VideoView
            key={media.id}
            style={StyleSheet.absoluteFill}
            player={player}
            nativeControls={false}
            contentFit="contain"
          />
        ) : mediaUrl ? (
          <Image source={{ uri: mediaUrl }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <View style={styles.mediaLoading}>
            <ActivityIndicator color="#fff" />
          </View>
        )
      ) : (
        <View style={styles.textSlideBackground} />
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]} pointerEvents="box-none">
        <StoryProgressBar count={slides.length} index={index} progress={progress} />
        <View style={styles.headerRow}>
          <Text style={[styles.overlayTextSmallBold, styles.headerTitle]} numberOfLines={1}>
            {story.title}
          </Text>
          {isOwner && onEdit ? (
            <Pressable accessibilityRole="button" onPress={onEdit} style={styles.headerButton}>
              <Text style={styles.overlayTextCaption}>{t('viewer.edit')}</Text>
            </Pressable>
          ) : null}
          <CloseButton onPress={onClose} isRTL={isRTL} />
        </View>
      </View>

      {caption ? (
        <View style={[styles.captionWrap, { paddingBottom: insets.bottom + Spacing.six }]} pointerEvents="none">
          <Text style={[styles.overlayTextSmall, styles.captionText]}>{caption}</Text>
        </View>
      ) : null}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.three }]}>
        <ActionButton icon={{ ios: 'info.circle', android: 'info', web: 'info' }} onPress={() => setShowInfo((v) => !v)} />
        {onComment ? (
          <ActionButton icon={{ ios: 'bubble.right', android: 'chat_bubble', web: 'chat_bubble' }} onPress={onComment} />
        ) : null}
        {onShare ? (
          <ActionButton icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} onPress={onShare} />
        ) : null}
      </View>

      {showInfo ? (
        <Pressable style={styles.infoOverlay} onPress={() => setShowInfo(false)}>
          <View style={styles.infoCard}>
            <Text style={styles.overlayTextSmallBold}>{story.title}</Text>
            {story.description ? (
              <Text style={[styles.overlayTextSmall, styles.infoDescription]}>{story.description}</Text>
            ) : null}
            {tags.length > 0 ? (
              <View style={styles.infoTagsRow}>
                {tags.map((tag) =>
                  onTagPress ? (
                    <Pressable key={tag.id} onPress={() => onTagPress(tag.name)}>
                      <Text style={styles.overlayTextCaption}>#{tag.name}</Text>
                    </Pressable>
                  ) : (
                    <Text key={tag.id} style={styles.overlayTextCaption}>
                      #{tag.name}
                    </Text>
                  ),
                )}
              </View>
            ) : null}
            <Text style={styles.overlayTextCaptionMuted}>
              {index + 1} / {slides.length}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function CloseButton({ onPress, isRTL }: { onPress: () => void; isRTL: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.headerButton}>
      <SymbolView
        name={{ ios: isRTL ? 'multiply' : 'multiply', android: 'close', web: 'close' }}
        size={18}
        tintColor="#fff"
      />
    </Pressable>
  );
}

function ActionButton({
  icon,
  onPress,
}: {
  icon: Parameters<typeof SymbolView>[0]['name'];
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionButton}>
      <SymbolView name={icon} size={22} tintColor="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  // This is a fixed dark, immersive overlay regardless of the app's
  // light/dark theme setting, so its text uses explicit white styling
  // rather than ThemedText (which would go black-on-black in light mode).
  overlayTextSubtitle: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  overlayTextSmallBold: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  overlayTextSmall: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  overlayTextCaption: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  overlayTextCaptionMuted: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  emptyTitle: {
    textAlign: 'center',
    paddingHorizontal: Spacing.five,
  },
  mediaLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSlideBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111',
  },
  tapZoneLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '30%',
    zIndex: 1,
  },
  tapZoneRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '30%',
    zIndex: 1,
  },
  tapZoneCenter: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '30%',
    right: '30%',
    zIndex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    flex: 1,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
    zIndex: 2,
  },
  captionText: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.six,
    zIndex: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 3,
  },
  infoCard: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  infoDescription: {
    opacity: 0.9,
  },
  infoTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
