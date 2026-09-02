import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';
import type { SlideBlock, StorySlideRow } from '@/types/domain';
import { parseSlideBlocks } from '@/types/domain';
import { deriveSearchFields } from './blocks';

export async function listSlides(storyId: string): Promise<StorySlideRow[]> {
  const { data, error } = await supabase
    .from('story_slides')
    .select('*')
    .eq('story_id', storyId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSlide(input: { storyId: string; position: number; blocks?: SlideBlock[]; eventDate?: string | null }) {
  const blocks = input.blocks ?? [];
  const search = deriveSearchFields(blocks);
  const { data, error } = await supabase
    .from('story_slides')
    .insert({
      story_id: input.storyId,
      position: input.position,
      blocks: blocks as unknown as Json,
      event_date: input.eventDate ?? null,
      ...search,
    })
    .select()
    .single();
  if (error) throw error;
  return parseSlideBlocks(data);
}

export async function updateSlideBlocks(slideId: string, blocks: SlideBlock[], eventDate?: string | null) {
  const search = deriveSearchFields(blocks);
  const { data, error } = await supabase
    .from('story_slides')
    .update({ blocks: blocks as unknown as Json, event_date: eventDate ?? null, ...search })
    .eq('id', slideId)
    .select()
    .single();
  if (error) throw error;
  return parseSlideBlocks(data);
}

export async function duplicateSlide(slide: StorySlideRow, newPosition: number) {
  return createSlide({
    storyId: slide.story_id,
    position: newPosition,
    blocks: Array.isArray(slide.blocks) ? (slide.blocks as unknown as SlideBlock[]) : [],
    eventDate: slide.event_date,
  });
}

export async function deleteSlide(id: string): Promise<void> {
  const { error } = await supabase.from('story_slides').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderSlides(storyId: string, orderedIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_slides', { p_story_id: storyId, p_ordered_ids: orderedIds });
  if (error) throw error;
}
