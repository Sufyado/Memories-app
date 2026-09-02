import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { Tag } from '@/types/domain';

type TagRow = Database['public']['Tables']['tags']['Row'];

function mapTag(row: TagRow): Tag {
  return { id: row.id, name: row.name };
}

export async function listStoryTags(storyId: string): Promise<Tag[]> {
  const { data, error } = await supabase.from('story_tags').select('tag_id').eq('story_id', storyId);
  if (error) throw error;
  const tagIds = (data ?? []).map((row) => row.tag_id);
  if (tagIds.length === 0) return [];

  const { data: tagRows, error: tagsError } = await supabase.from('tags').select('*').in('id', tagIds);
  if (tagsError) throw tagsError;
  return (tagRows ?? []).map(mapTag);
}

async function findOrCreateTag(name: string): Promise<Tag> {
  const normalized = name.trim().toLowerCase();
  const { data: existing, error: findError } = await supabase
    .from('tags')
    .select('*')
    .eq('name', normalized)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return mapTag(existing);

  const { data: created, error: createError } = await supabase
    .from('tags')
    .insert({ name: normalized })
    .select('*')
    .single();
  if (createError) {
    // Someone else created the same tag name between our lookup and
    // insert (unique_violation) — just use theirs.
    if (createError.code === '23505') {
      const { data: raceWinner, error: refetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('name', normalized)
        .single();
      if (refetchError) throw refetchError;
      return mapTag(raceWinner);
    }
    throw createError;
  }
  return mapTag(created);
}

export async function addTagToStory(storyId: string, tagName: string): Promise<Tag> {
  const tag = await findOrCreateTag(tagName);
  const { error } = await supabase.from('story_tags').insert({ story_id: storyId, tag_id: tag.id });
  if (error) throw error;
  return tag;
}

export async function removeTagFromStory(storyId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('story_tags').delete().eq('story_id', storyId).eq('tag_id', tagId);
  if (error) throw error;
}
