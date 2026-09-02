import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { Folder } from '@/types/domain';

type FolderRow = Database['public']['Tables']['folders']['Row'];

function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    parentFolderId: row.parent_folder_id,
    name: row.name,
    coverMediaId: row.cover_media_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Folders owned by the current user, directly inside `parentFolderId` (null = top level). */
export async function listFolders(parentFolderId: string | null): Promise<Folder[]> {
  let query = supabase.from('folders').select('*').order('updated_at', { ascending: false });
  query = parentFolderId ? query.eq('parent_folder_id', parentFolderId) : query.is('parent_folder_id', null);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapFolder);
}

export async function getFolder(id: string): Promise<Folder | null> {
  const { data, error } = await supabase.from('folders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapFolder(data) : null;
}

export async function createFolder(params: {
  name: string;
  parentFolderId: string | null;
  createdBy: string;
}): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .insert({ name: params.name, parent_folder_id: params.parentFolderId, created_by: params.createdBy })
    .select('*')
    .single();
  if (error) throw error;
  return mapFolder(data);
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}

/** Number of stories directly inside a folder (not counting subfolders). */
export async function countStoriesInFolder(folderId: string): Promise<number> {
  const { count, error } = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('folder_id', folderId);
  if (error) throw error;
  return count ?? 0;
}
