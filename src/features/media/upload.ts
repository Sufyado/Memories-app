import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

import { supabase } from '@/lib/supabase';
import { STORY_MEDIA_BUCKET } from './storage';
import type { MediaType } from '@/types/domain';

const THUMBNAIL_MAX_WIDTH = 480;

export type PickedAsset = {
  uri: string;
  mediaType: MediaType;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  fileSize?: number | null;
  fileName?: string | null;
};

export type UploadedMedia = {
  storagePath: string;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
};

function extensionFor(asset: PickedAsset): string {
  const fromName = asset.fileName?.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (asset.mimeType?.includes('/')) return asset.mimeType.split('/')[1] ?? 'bin';
  return asset.mediaType === 'video' ? 'mp4' : 'jpg';
}

async function uploadBinary(
  path: string,
  localUri: string,
  mimeType: string | undefined,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('You must be signed in to upload media.');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase is not configured.');

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORY_MEDIA_BUCKET}/${path}`;
  const file = new File(localUri);
  const task = file.createUploadTask(uploadUrl, {
    httpMethod: 'POST',
    uploadType: UploadType.BINARY_CONTENT,
    mimeType,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      'Content-Type': mimeType ?? 'application/octet-stream',
    },
    onProgress: (progress) => {
      onProgress?.(progress.totalBytes > 0 ? progress.bytesSent / progress.totalBytes : 0);
    },
  });

  const result = await task.uploadAsync();
  if (result.status >= 400) {
    throw new Error(`Upload failed (${result.status}): ${result.body}`);
  }
}

async function buildThumbnail(asset: PickedAsset): Promise<{ uri: string; width: number; height: number } | null> {
  if (Platform.OS === 'web') return null;

  try {
    if (asset.mediaType === 'image') {
      const result = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: THUMBNAIL_MAX_WIDTH } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
      );
      return result;
    }
    if (asset.mediaType === 'video') {
      const result = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0 });
      return result;
    }
  } catch (err) {
    console.warn('Thumbnail generation failed, continuing without one', err);
  }
  return null;
}

/**
 * Uploads a picked image/video to Storage under {storyId}/{slideId}/{mediaId}.{ext},
 * plus a best-effort thumbnail, and returns everything needed to insert a `media` row.
 */
export async function uploadMediaAsset(
  storyId: string,
  slideId: string,
  asset: PickedAsset,
  onProgress?: (fraction: number) => void,
): Promise<{ mediaId: string; media: UploadedMedia }> {
  const mediaId = Crypto.randomUUID();
  const ext = extensionFor(asset);
  const storagePath = `${storyId}/${slideId}/${mediaId}.${ext}`;

  const thumbnail = await buildThumbnail(asset);
  const thumbnailPath = thumbnail ? `${storyId}/${slideId}/${mediaId}_thumb.jpg` : null;

  if (thumbnail && thumbnailPath) {
    // Thumbnails are small; upload without granular progress so it doesn't
    // interfere with the main asset's progress bar.
    await uploadBinary(thumbnailPath, thumbnail.uri, 'image/jpeg');
  }

  await uploadBinary(storagePath, asset.uri, asset.mimeType ?? undefined, onProgress);

  return {
    mediaId,
    media: {
      storagePath,
      thumbnailPath,
      width: thumbnail?.width ?? asset.width ?? null,
      height: thumbnail?.height ?? asset.height ?? null,
    },
  };
}
