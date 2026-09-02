import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { Media } from '@/types/domain';

type MediaRow = Database['public']['Tables']['media']['Row'];

function mapMedia(row: MediaRow): Media {
  return {
    id: row.id,
    storyId: row.story_id,
    slideId: row.slide_id,
    type: row.type,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    durationMs: row.duration_ms,
    thumbnailPath: row.thumbnail_path,
    createdAt: row.created_at,
  };
}

function randomFileId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionFromMimeType(mimeType: string): string {
  const subtype = mimeType.split('/')[1] ?? 'bin';
  return subtype.split(';')[0];
}

/** Reads a local file URI (from the camera/image-picker) into bytes suitable for `storage.upload`. */
async function readLocalFile(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

async function uploadBytes(path: string, bytes: ArrayBuffer, contentType: string): Promise<void> {
  const { error } = await supabase.storage.from('media').upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;
}

export async function uploadMedia(params: {
  storyId: string;
  type: 'image' | 'video' | 'file';
  localUri: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  /** Local URI of a generated thumbnail (videos only). */
  thumbnailLocalUri?: string | null;
}): Promise<Media> {
  const ext = extensionFromMimeType(params.mimeType);
  const storagePath = `stories/${params.storyId}/${randomFileId()}.${ext}`;

  const bytes = await readLocalFile(params.localUri);
  await uploadBytes(storagePath, bytes, params.mimeType);

  let thumbnailPath: string | null = null;
  if (params.thumbnailLocalUri) {
    thumbnailPath = `stories/${params.storyId}/${randomFileId()}.jpg`;
    try {
      const thumbBytes = await readLocalFile(params.thumbnailLocalUri);
      await uploadBytes(thumbnailPath, thumbBytes, 'image/jpeg');
    } catch {
      // Thumbnail is a nice-to-have; the slide still works without one.
      thumbnailPath = null;
    }
  }

  const { data, error } = await supabase
    .from('media')
    .insert({
      story_id: params.storyId,
      type: params.type,
      storage_path: storagePath,
      mime_type: params.mimeType,
      width: params.width ?? null,
      height: params.height ?? null,
      duration_ms: params.durationMs ?? null,
      thumbnail_path: thumbnailPath,
    })
    .select('*')
    .single();

  if (error) {
    // Best-effort cleanup so a failed metadata insert doesn't leave an
    // orphaned file behind.
    await supabase.storage.from('media').remove([storagePath, ...(thumbnailPath ? [thumbnailPath] : [])]);
    throw error;
  }

  return mapMedia(data);
}

export async function listMediaByIds(ids: string[]): Promise<Media[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('media').select('*').in('id', ids);
  if (error) throw error;
  return (data ?? []).map(mapMedia);
}

export async function deleteMedia(media: Media): Promise<void> {
  const paths = [media.storagePath, ...(media.thumbnailPath ? [media.thumbnailPath] : [])];
  const { error: storageError } = await supabase.storage.from('media').remove(paths);
  if (storageError) throw storageError;

  const { error } = await supabase.from('media').delete().eq('id', media.id);
  if (error) throw error;
}

/** The `media` bucket is private, so viewing anything in it needs a signed URL. */
export async function getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from('media').createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
