import { supabase } from '@/lib/supabase';
import type { Media, MediaType } from '@/types/domain';

export async function listMediaForStory(storyId: string): Promise<Media[]> {
  const { data, error } = await supabase.from('media').select('*').eq('story_id', storyId);
  if (error) throw error;
  return data;
}

export async function insertMediaRow(input: {
  id: string;
  storyId: string;
  slideId: string;
  type: MediaType;
  storagePath: string;
  thumbnailPath?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  sizeBytes?: number | null;
  createdBy: string;
}): Promise<Media> {
  const { data, error } = await supabase
    .from('media')
    .insert({
      id: input.id,
      story_id: input.storyId,
      slide_id: input.slideId,
      type: input.type,
      storage_path: input.storagePath,
      thumbnail_path: input.thumbnailPath ?? null,
      mime_type: input.mimeType ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration_ms: input.durationMs ?? null,
      size_bytes: input.sizeBytes ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMediaRow(id: string): Promise<Media> {
  const { data, error } = await supabase.from('media').delete().eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function removeStorageObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from('story-media').remove(paths);
  if (error) throw error;
}
