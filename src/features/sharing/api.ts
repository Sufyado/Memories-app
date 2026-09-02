import { supabase } from '@/lib/supabase';
import type { ShareLink, StoryVisibility } from '@/types/domain';

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || 'story'}-${suffix}`;
}

export async function getActiveShareLink(storyId: string): Promise<ShareLink | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('story_id', storyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createShareLink(storyId: string, title: string, createdBy: string): Promise<ShareLink> {
  const { data, error } = await supabase
    .from('share_links')
    .insert({ story_id: storyId, slug: slugify(title), created_by: createdBy })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('stories').update({ visibility: 'public' as StoryVisibility }).eq('id', storyId);

  return data;
}

export async function setShareLinkActive(id: string, isActive: boolean): Promise<ShareLink> {
  const { data, error } = await supabase
    .from('share_links')
    .update({ is_active: isActive, disabled_at: isActive ? null : new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
