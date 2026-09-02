import { supabase } from '@/lib/supabase/client';
import type { Database, Json } from '@/lib/supabase/database.types';
import type { SlideBlock, StorySlide } from '@/types/domain';

type SlideRow = Database['public']['Tables']['story_slides']['Row'];

function mapSlide(row: SlideRow): StorySlide {
  return {
    id: row.id,
    storyId: row.story_id,
    order: row.order_index,
    mediaId: row.media_id,
    mediaType: row.media_type,
    blocks: (row.blocks as unknown as SlideBlock[]) ?? [],
    eventDate: row.event_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSlides(storyId: string): Promise<StorySlide[]> {
  const { data, error } = await supabase
    .from('story_slides')
    .select('*')
    .eq('story_id', storyId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapSlide);
}

export async function createSlide(params: {
  storyId: string;
  orderIndex: number;
  blocks: SlideBlock[];
  mediaId?: string | null;
  mediaType?: 'image' | 'video' | null;
}): Promise<StorySlide> {
  const { data, error } = await supabase
    .from('story_slides')
    .insert({
      story_id: params.storyId,
      order_index: params.orderIndex,
      blocks: params.blocks as unknown as Json,
      media_id: params.mediaId ?? null,
      media_type: params.mediaType ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapSlide(data);
}

export async function updateSlideBlocks(id: string, blocks: SlideBlock[]): Promise<StorySlide> {
  const { data, error } = await supabase
    .from('story_slides')
    .update({ blocks: blocks as unknown as Json })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapSlide(data);
}

export async function deleteSlide(id: string): Promise<void> {
  const { error } = await supabase.from('story_slides').delete().eq('id', id);
  if (error) throw error;
}

/** Persists a new slide order. `orderedIds` must be the slide ids in their final order. */
export async function reorderSlides(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) => supabase.from('story_slides').update({ order_index: index }).eq('id', id)),
  );
}
