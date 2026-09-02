import * as ImagePicker from 'expo-image-picker';

import type { PickedAsset } from './upload';

function toPickedAsset(asset: ImagePicker.ImagePickerAsset): PickedAsset {
  return {
    uri: asset.uri,
    mediaType: asset.type === 'video' ? 'video' : 'image',
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? null,
    fileSize: asset.fileSize ?? null,
    fileName: asset.fileName,
  };
}

export async function pickFromCamera(mode: 'image' | 'video' = 'image'): Promise<PickedAsset | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: mode === 'video' ? ['videos'] : ['images'],
    quality: 0.85,
    videoMaxDuration: 120,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return toPickedAsset(result.assets[0]);
}

export async function pickFromLibrary(options?: { allowVideos?: boolean; multiple?: boolean }): Promise<PickedAsset[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options?.allowVideos === false ? ['images'] : ['images', 'videos'],
    quality: 0.85,
    allowsMultipleSelection: options?.multiple ?? true,
  });

  if (result.canceled || !result.assets) return [];
  return result.assets.map(toPickedAsset);
}
