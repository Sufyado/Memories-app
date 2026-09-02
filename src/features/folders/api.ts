import { supabase } from '@/lib/supabase';
import type { Folder } from '@/types/domain';

export async function listFolders(parentFolderId: string | null = null): Promise<Folder[]> {
  const query = supabase.from('folders').select('*').order('updated_at', { ascending: false });
  const { data, error } =
    parentFolderId === null ? await query.is('parent_folder_id', null) : await query.eq('parent_folder_id', parentFolderId);
  if (error) throw error;
  return data;
}

export async function getFolder(id: string): Promise<Folder> {
  const { data, error } = await supabase.from('folders').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createFolder(input: { name: string; ownerId: string; parentFolderId?: string | null }): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .insert({ name: input.name, owner_id: input.ownerId, parent_folder_id: input.parentFolderId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const { data, error } = await supabase.from('folders').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}

/** Count of stories directly inside a folder (not recursive). */
export async function countStoriesInFolder(folderId: string): Promise<number> {
  const { count, error } = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('folder_id', folderId);
  if (error) throw error;
  return count ?? 0;
}
