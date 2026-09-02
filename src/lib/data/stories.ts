import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { Story } from '@/types/domain';

type StoryRow = Database['public']['Tables']['stories']['Row'];

function mapStory(row: StoryRow): Story {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description,
    coverMediaId: row.cover_media_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
    visibility: row.visibility,
    status: row.status,
    version: row.version,
  };
}

/**
 * Stories the current user owns, directly inside `folderId` (null = top
 * level). Scoped to `created_by` explicitly rather than relying on the
 * full RLS-permitted set, which also includes stories made accessible via
 * an active public share link — that's for the dedicated share viewer
 * (Phase 7), not "everything I have access to" in my own Library.
 */
export async function listMyStories(params: {
  ownerId: string;
  folderId: string | null;
  limit?: number;
}): Promise<Story[]> {
  let query = supabase
    .from('stories')
    .select('*')
    .eq('created_by', params.ownerId)
    .order('updated_at', { ascending: false });
  query = params.folderId ? query.eq('folder_id', params.folderId) : query.is('folder_id', null);
  if (params.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapStory);
}

/** The user's most recently updated stories, regardless of folder — for the Home screen. */
export async function listRecentStories(ownerId: string, limit: number): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('created_by', ownerId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapStory);
}

export async function getStory(id: string): Promise<Story | null> {
  const { data, error } = await supabase.from('stories').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapStory(data) : null;
}

export async function createStory(params: {
  title: string;
  folderId: string | null;
  createdBy: string;
}): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      title: params.title,
      folder_id: params.folderId,
      created_by: params.createdBy,
      updated_by: params.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapStory(data);
}

export async function updateStory(
  id: string,
  updatedBy: string,
  changes: { title?: string; description?: string | null; folderId?: string | null },
): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .update({
      ...(changes.title !== undefined ? { title: changes.title } : {}),
      ...(changes.description !== undefined ? { description: changes.description } : {}),
      ...(changes.folderId !== undefined ? { folder_id: changes.folderId } : {}),
      updated_by: updatedBy,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapStory(data);
}

export async function deleteStory(id: string): Promise<void> {
  const { error } = await supabase.from('stories').delete().eq('id', id);
  if (error) throw error;
}
