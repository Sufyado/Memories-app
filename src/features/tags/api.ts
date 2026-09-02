import { supabase } from '@/lib/supabase';
import type { Tag } from '@/types/domain';
import type { StoryWithSlideCount } from '@/features/stories/api';

export async function getTag(id: string): Promise<Tag> {
  const { data, error } = await supabase.from('tags').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function listTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function listTagsForStory(storyId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('story_tags')
    .select('tags(*)')
    .eq('story_id', storyId);
  if (error) throw error;
  return (data as unknown as { tags: Tag }[]).map((row) => row.tags).filter(Boolean);
}

export async function ensureTag(ownerId: string, name: string): Promise<Tag> {
  const trimmed = name.trim();
  const { data: existing, error: selectError } = await supabase
    .from('tags')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('name', trimmed)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing;

  const { data, error } = await supabase.from('tags').insert({ owner_id: ownerId, name: trimmed }).select().single();
  if (error) throw error;
  return data;
}

export async function attachTag(storyId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('story_tags').upsert({ story_id: storyId, tag_id: tagId });
  if (error) throw error;
}

export async function detachTag(storyId: string, tagId: string): Promise<void> {
  const { error } = await supabase.from('story_tags').delete().eq('story_id', storyId).eq('tag_id', tagId);
  if (error) throw error;
}

export async function listStoriesForTag(tagId: string): Promise<StoryWithSlideCount[]> {
  const { data, error } = await supabase
    .from('story_tags')
    .select('stories(*, story_slides(count))')
    .eq('tag_id', tagId);
  if (error) throw error;
  return (data as unknown as { stories: StoryWithSlideCount & { story_slides: { count: number }[] } }[])
    .map((row) => row.stories)
    .filter(Boolean)
    .map((s) => {
      const { story_slides, ...story } = s;
      return { ...story, slide_count: story_slides?.[0]?.count ?? 0 };
    });
}
