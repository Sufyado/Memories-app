import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import type { StoryRole } from '@/types/domain';

/** The current user's role on a story (owner is auto-enrolled as a story_members row). */
export function useMyStoryRole(storyId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['story-role', storyId, user?.id],
    queryFn: async (): Promise<StoryRole | null> => {
      const { data, error } = await supabase
        .from('story_members')
        .select('role')
        .eq('story_id', storyId as string)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role ?? null;
    },
    enabled: !!storyId && !!user,
  });
}

export function canEdit(role: StoryRole | null | undefined) {
  return role === 'owner' || role === 'editor';
}
