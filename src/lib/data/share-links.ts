import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { ShareLink } from '@/types/domain';

type ShareLinkRow = Database['public']['Tables']['share_links']['Row'];

function mapShareLink(row: ShareLinkRow): ShareLink {
  return {
    id: row.id,
    storyId: row.story_id,
    slug: row.slug,
    visibility: row.visibility,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'story'
  );
}

/** The story's most recent share link, if any (active or not). */
export async function getShareLink(storyId: string): Promise<ShareLink | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapShareLink(data) : null;
}

export async function createShareLink(params: {
  storyId: string;
  createdBy: string;
  storyTitle: string;
  visibility: 'link' | 'public';
}): Promise<ShareLink> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = `${slugify(params.storyTitle)}-${randomSlugSuffix()}`;
    const { data, error } = await supabase
      .from('share_links')
      .insert({
        story_id: params.storyId,
        slug,
        visibility: params.visibility,
        created_by: params.createdBy,
      })
      .select('*')
      .single();
    if (!error) return mapShareLink(data);
    if (error.code !== '23505') throw error; // retry only on slug collision
  }
  throw new Error('Could not generate a unique share link. Please try again.');
}

export async function setShareLinkActive(id: string, isActive: boolean): Promise<ShareLink> {
  const { data, error } = await supabase
    .from('share_links')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapShareLink(data);
}

export function getShareUrl(slug: string): string {
  const base =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : process.env.EXPO_PUBLIC_WEB_BASE_URL || 'http://localhost:8081';
  return `${base}/s/${slug}`;
}

/** Resolves a public share slug to its story id — used by the public web viewer. */
export async function resolveShareSlug(slug: string): Promise<ShareLink | null> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapShareLink(data) : null;
}
