import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database';
import type { Story } from '@/types/domain';

export type StoryWithSlideCount = Story & { slide_count: number };

function withSlideCount(row: Story & { story_slides: { count: number }[] }): StoryWithSlideCount {
  const { story_slides, ...story } = row;
  return { ...story, slide_count: story_slides?.[0]?.count ?? 0 };
}

const LIST_SELECT = '*, story_slides(count)';

export async function listRecentStories(limit = 10): Promise<StoryWithSlideCount[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(LIST_SELECT)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as (Story & { story_slides: { count: number }[] })[]).map(withSlideCount);
}

export async function listStories(options: {
  folderId?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<StoryWithSlideCount[]> {
  const { folderId, page = 0, pageSize = 20 } = options;
  let query = supabase
    .from('stories')
    .select(LIST_SELECT)
    .order('updated_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (folderId === null) query = query.is('folder_id', null);
  else if (folderId) query = query.eq('folder_id', folderId);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as (Story & { story_slides: { count: number }[] })[]).map(withSlideCount);
}

export async function getStory(id: string): Promise<Story> {
  const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getStoryBySlug(slug: string): Promise<Story> {
  const { data, error } = await supabase.from('stories').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

export async function createStory(input: {
  ownerId: string;
  title: string;
  description?: string | null;
  folderId?: string | null;
}): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      owner_id: input.ownerId,
      created_by: input.ownerId,
      updated_by: input.ownerId,
      title: input.title,
      description: input.description ?? null,
      folder_id: input.folderId ?? null,
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStoryMeta(
  id: string,
  patch: Partial<Pick<Story, 'title' | 'description' | 'folder_id' | 'visibility' | 'status'>>,
  updatedBy: string,
): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStory(id: string): Promise<void> {
  const { error } = await supabase.from('stories').delete().eq('id', id);
  if (error) throw error;
}

/** Publishes edits: snapshots the story+slides, bumps `version`, records a story_versions row. */
export async function publishStoryVersion(id: string, snapshot: Json): Promise<number> {
  const { data, error } = await supabase.rpc('bump_story_version', { p_story_id: id, p_snapshot: snapshot });
  if (error) throw error;
  await supabase.from('stories').update({ status: 'published' }).eq('id', id).eq('status', 'draft');
  return data;
}
