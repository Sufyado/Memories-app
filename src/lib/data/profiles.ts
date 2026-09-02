import { supabase } from '@/lib/supabase/client';

export type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function listProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, displayName: row.display_name, avatarUrl: row.avatar_url }));
}
