import { supabase } from '@/lib/supabase/client';
import { listProfilesByIds } from '@/lib/data/profiles';
import type { StoryMember, TeamRole } from '@/types/domain';

export type StoryMemberWithProfile = StoryMember & { displayName: string | null };

export async function listStoryMembers(storyId: string): Promise<StoryMemberWithProfile[]> {
  const { data, error } = await supabase.from('story_members').select('*').eq('story_id', storyId);
  if (error) throw error;
  const rows = data ?? [];
  const profiles = await listProfilesByIds(rows.map((r) => r.user_id));
  const nameById = Object.fromEntries(profiles.map((p) => [p.id, p.displayName]));
  return rows.map((row) => ({
    storyId: row.story_id,
    userId: row.user_id,
    role: row.role as TeamRole,
    displayName: nameById[row.user_id] ?? null,
  }));
}

/** Finds a user by exact email and adds them to the story with the given role. */
export async function inviteMemberByEmail(
  storyId: string,
  email: string,
  role: Exclude<TeamRole, 'owner'>,
): Promise<StoryMemberWithProfile> {
  const { data, error } = await supabase.rpc('find_user_by_email', { lookup_email: email.trim().toLowerCase() });
  if (error) throw error;
  const match = data?.[0];
  if (!match) throw new Error('No account found with that email.');

  const { error: insertError } = await supabase
    .from('story_members')
    .insert({ story_id: storyId, user_id: match.id, role });
  if (insertError) throw insertError;

  return { storyId, userId: match.id, role, displayName: match.display_name };
}

export async function removeMember(storyId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('story_members').delete().eq('story_id', storyId).eq('user_id', userId);
  if (error) throw error;
}
