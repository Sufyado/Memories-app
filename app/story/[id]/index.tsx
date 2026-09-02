import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StatusBar, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { IconButton, LoadingView, Text } from '@/design-system';
import { useStory } from '@/features/stories/hooks';
import { useSlides } from '@/features/slides/hooks';
import { useMediaMap } from '@/features/media/hooks';
import { useMyStoryRole, canEdit } from '@/features/stories/roles';
import { parseSlideBlocks } from '@/types/domain';
import { StoryProgressBar } from '@/features/stories/viewer/StoryProgressBar';
import { SlideContent } from '@/features/stories/viewer/SlideContent';
import { StoryInfoSheet } from '@/features/stories/viewer/StoryInfoSheet';

const TEXT_SLIDE_DURATION_MS = 6000;

export default function StoryViewerScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const story = useStory(id);
  const slidesQuery = useSlides(id);
  const mediaMap = useMediaMap(id);
  const role = useMyStoryRole(id);

  const slides = useMemo(() => (slidesQuery.data ?? []).map(parseSlideBlocks), [slidesQuery.data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const pausedValueRef = useRef(0);

  const currentSlide = slides[currentIndex];
  const currentMediaBlock = currentSlide?.blocks.find((b) => b.type === 'media');
  const currentMedia = currentMediaBlock?.type === 'media' ? mediaMap[currentMediaBlock.mediaId] : undefined;
  const isVideoSlide = currentMedia?.type === 'video';

  function goNext() {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
  }
  function goPrev() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  useEffect(() => {
    progress.setValue(0);
    pausedValueRef.current = 0;
    if (isVideoSlide || !currentSlide) return;

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: TEXT_SLIDE_DURATION_MS,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) goNext();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isVideoSlide]);

  function pause() {
    setIsPaused(true);
    if (!isVideoSlide) {
      progress.stopAnimation((value) => {
        pausedValueRef.current = value;
      });
    }
  }

  function resume() {
    setIsPaused(false);
    if (!isVideoSlide) {
      const remaining = (1 - pausedValueRef.current) * TEXT_SLIDE_DURATION_MS;
      Animated.timing(progress, { toValue: 1, duration: remaining, useNativeDriver: false }).start(({ finished }) => {
        if (finished) goNext();
      });
    }
  }

  if (story.isLoading || slidesQuery.isLoading) return <LoadingView />;
  if (!story.data) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      {currentSlide ? (
        <SlideContent
          key={currentSlide.id}
          slide={currentSlide}
          mediaMap={mediaMap}
          isActive
          isPaused={isPaused}
          onVideoEnd={goNext}
          onVideoProgress={(fraction) => progress.setValue(fraction)}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff' }}>{t('folder.empty')}</Text>
        </View>
      )}

      {/* Tap zones: left = previous, right = next. Long-press anywhere pauses. */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
        <Pressable style={{ flex: 1 }} onPress={goPrev} onLongPress={pause} delayLongPress={180} onPressOut={resume} />
        <Pressable style={{ flex: 1 }} onPress={goNext} onLongPress={pause} delayLongPress={180} onPressOut={resume} />
      </View>

      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <View style={{ paddingHorizontal: 12, paddingTop: 8, gap: 10 }}>
          {slides.length > 0 ? (
            <StoryProgressBar count={slides.length} currentIndex={currentIndex} progress={progress} />
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text weight="semibold" style={{ color: '#fff', flex: 1 }} numberOfLines={1}>
              {story.data.title || t('common.untitled')}
            </Text>
            {slides.length > 0 ? (
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {String(currentIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </Text>
            ) : null}
            <IconButton accessibilityLabel={t('common.close')} variant="overlay" onPress={() => router.back()}>
              <Ionicons name="close" size={20} color="#fff" />
            </IconButton>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 12 }}>
          <IconButton accessibilityLabel={t('story.viewerInfo')} variant="overlay" onPress={() => setInfoVisible(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          </IconButton>
          <IconButton
            accessibilityLabel={t('common.share')}
            variant="overlay"
            onPress={() => router.push(`/story/${id}/share`)}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
          </IconButton>
          {canEdit(role.data) ? (
            <IconButton
              accessibilityLabel={t('common.edit')}
              variant="overlay"
              onPress={() => router.push(`/story/${id}/edit`)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </IconButton>
          ) : null}
        </View>
      </SafeAreaView>

      <StoryInfoSheet visible={infoVisible} story={story.data} onClose={() => setInfoVisible(false)} />
    </View>
  );
}
