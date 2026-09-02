import { supabase } from '@/lib/supabase';
import type { Profile, StoryMember, StoryRole } from '@/types/domain';

export type MemberWithProfile = StoryMember & { profile: Profile | null };

export async function listMembers(storyId: string): Promise<MemberWithProfile[]> {
  const { data, error } = await supabase
    .from('story_members')
    .select('*, profile:profiles!story_members_user_id_fkey(*)')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as unknown as MemberWithProfile[];
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
  if (error) throw error;
  return data;
}

export async function addMember(input: {
  storyId: string;
  userId: string;
  role: StoryRole;
  invitedBy: string;
}): Promise<StoryMember> {
  const { data, error } = await supabase
    .from('story_members')
    .upsert({ story_id: input.storyId, user_id: input.userId, role: input.role, invited_by: input.invitedBy })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMemberRole(storyId: string, userId: string, role: StoryRole): Promise<void> {
  const { error } = await supabase.from('story_members').update({ role }).eq('story_id', storyId).eq('user_id', userId);
  if (error) throw error;
}

export async function removeMember(storyId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('story_members').delete().eq('story_id', storyId).eq('user_id', userId);
  if (error) throw error;
}
