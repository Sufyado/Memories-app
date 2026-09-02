import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedMedia = {
  type: 'image' | 'video';
  uri: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
};

function toPickedMedia(asset: ImagePicker.ImagePickerAsset): PickedMedia | null {
  if (asset.type !== 'image' && asset.type !== 'video') return null;
  return {
    type: asset.type,
    uri: asset.uri,
    mimeType: asset.mimeType ?? (asset.type === 'image' ? 'image/jpeg' : 'video/mp4'),
    width: asset.width || null,
    height: asset.height || null,
    durationMs: asset.duration ?? null,
  };
}

/** Launches the camera. Returns null if the user cancels or permission is denied. */
export async function captureFromCamera(mediaType: 'images' | 'videos'): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: [mediaType],
    quality: 0.8,
    videoMaxDuration: 120,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return toPickedMedia(result.assets[0]);
}

/** Opens the photo/video library. Returns null if the user cancels or permission is denied. */
export async function pickFromLibrary(): Promise<PickedMedia | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return toPickedMedia(result.assets[0]);
}
