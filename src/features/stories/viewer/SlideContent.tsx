import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Text } from '@/design-system';
import { useSignedMediaUrl } from '@/features/media/storage';
import type { Media, SlideBlock, StorySlide } from '@/types/domain';

type SlideContentProps = {
  slide: StorySlide;
  mediaMap: Record<string, Media>;
  isActive: boolean;
  isPaused: boolean;
  onVideoEnd: () => void;
  onVideoProgress: (fraction: number) => void;
};

export function SlideContent({ slide, mediaMap, isActive, isPaused, onVideoEnd, onVideoProgress }: SlideContentProps) {
  const mediaBlock = slide.blocks.find((b) => b.type === 'media');
  const media = mediaBlock?.type === 'media' ? mediaMap[mediaBlock.mediaId] : undefined;
  const textBlocks = slide.blocks.filter((b) => b.type !== 'media');

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {media ? (
        <MediaBackground
          media={media}
          isActive={isActive}
          isPaused={isPaused}
          onVideoEnd={onVideoEnd}
          onVideoProgress={onVideoProgress}
        />
      ) : null}

      {textBlocks.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 20,
            paddingBottom: 32,
            gap: 10,
            backgroundColor: media ? 'rgba(0,0,0,0.35)' : 'transparent',
          }}
        >
          {textBlocks.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MediaBackground({
  media,
  isActive,
  isPaused,
  onVideoEnd,
  onVideoProgress,
}: {
  media: Media;
  isActive: boolean;
  isPaused: boolean;
  onVideoEnd: () => void;
  onVideoProgress: (fraction: number) => void;
}) {
  const { data: signedUrl } = useSignedMediaUrl(media.storage_path);

  if (media.type === 'video') {
    return (
      <ActiveVideo
        uri={isActive ? signedUrl : undefined}
        isActive={isActive}
        isPaused={isPaused}
        onEnd={onVideoEnd}
        onProgress={onVideoProgress}
      />
    );
  }

  return signedUrl ? (
    <Image source={{ uri: signedUrl }} style={{ flex: 1 }} contentFit="cover" transition={150} />
  ) : (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.4)" />
    </View>
  );
}

function ActiveVideo({
  uri,
  isActive,
  isPaused,
  onEnd,
  onProgress,
}: {
  uri: string | undefined;
  isActive: boolean;
  isPaused: boolean;
  onEnd: () => void;
  onProgress: (fraction: number) => void;
}) {
  const player = useVideoPlayer(uri ?? null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  React.useEffect(() => {
    const endSub = player.addListener('playToEnd', onEnd);
    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      if (player.duration > 0) onProgress(Math.min(currentTime / player.duration, 1));
    });
    return () => {
      endSub.remove();
      timeSub.remove();
    };
  }, [player, onEnd, onProgress]);

  React.useEffect(() => {
    if (!isActive) return;
    if (isPaused) player.pause();
    else player.play();
  }, [isActive, isPaused, player]);

  if (!uri) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.4)" />
      </View>
    );
  }

  return <VideoView player={player} style={{ flex: 1 }} contentFit="cover" nativeControls={false} />;
}

function BlockView({ block }: { block: SlideBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <Text variant="title" weight="bold" color="onBrand" style={{ color: '#fff' }}>
          {block.text}
        </Text>
      );
    case 'body':
      return (
        <Text variant="body" style={{ color: '#fff' }}>
          {block.text}
        </Text>
      );
    case 'caption':
      return (
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
          {block.text}
        </Text>
      );
    case 'quote':
      return (
        <View style={{ borderLeftWidth: 3, borderLeftColor: '#fff', paddingLeft: 10 }}>
          <Text variant="body" style={{ color: '#fff', fontStyle: 'italic' }}>
            “{block.text}”
          </Text>
          {block.author ? (
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
              — {block.author}
            </Text>
          ) : null}
        </View>
      );
    case 'warning':
      return (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            backgroundColor: 'rgba(255,176,32,0.18)',
            borderWidth: 1,
            borderColor: '#FFB020',
            borderRadius: 10,
            padding: 10,
          }}
        >
          <Ionicons name="warning-outline" size={16} color="#FFB020" />
          <Text variant="caption" style={{ color: '#fff', flex: 1 }}>
            {block.text}
          </Text>
        </View>
      );
    case 'checklist':
      return (
        <View style={{ gap: 4 }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name={item.done ? 'checkbox' : 'square-outline'} size={16} color="#fff" />
              <Text variant="caption" style={{ color: '#fff' }}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'link':
      return (
        <Pressable
          onPress={() => Linking.openURL(block.url)}
          style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
        >
          <Ionicons name="link-outline" size={16} color="#fff" />
          <Text variant="caption" style={{ color: '#fff', textDecorationLine: 'underline' }}>
            {block.label ?? block.url}
          </Text>
        </Pressable>
      );
    case 'file':
      return (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Ionicons name="document-attach-outline" size={16} color="#fff" />
          <Text variant="caption" style={{ color: '#fff' }}>
            {block.label ?? 'Attachment'}
          </Text>
        </View>
      );
    default:
      return null;
  }
}
