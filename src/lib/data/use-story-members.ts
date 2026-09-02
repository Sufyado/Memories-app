import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { inviteMemberByEmail, listStoryMembers, removeMember, type StoryMemberWithProfile } from '@/lib/data/story-members';
import type { TeamRole } from '@/types/domain';

export function useStoryMembers(storyId: string | undefined) {
  const [members, setMembers] = useState<StoryMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    try {
      setMembers(await listStoryMembers(storyId));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const invite = useCallback(
    async (email: string, role: Exclude<TeamRole, 'owner'>) => {
      if (!storyId) return;
      const member = await inviteMemberByEmail(storyId, email, role);
      setMembers((prev) => [...prev.filter((m) => m.userId !== member.userId), member]);
    },
    [storyId],
  );

  const remove = useCallback(
    async (userId: string) => {
      if (!storyId) return;
      await removeMember(storyId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    },
    [storyId],
  );

  return { members, loading, refresh, invite, remove };
}
