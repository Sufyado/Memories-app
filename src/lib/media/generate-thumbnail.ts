import { Platform } from 'react-native';

/** Generates a JPEG thumbnail for a local video file. Returns null where unsupported (web) or on failure. */
export async function generateVideoThumbnail(videoUri: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const VideoThumbnails = await import('expo-video-thumbnails');
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 0 });
    return uri;
  } catch {
    return null;
  }
}
