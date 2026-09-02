import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { useAuth } from '@/features/auth/AuthProvider';
import type { StoryRole } from '@/types/domain';

export function useMembers(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story-members', storyId],
    queryFn: () => api.listMembers(storyId as string),
    enabled: !!storyId,
  });
}

export function useInviteMember(storyId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { email: string; role: StoryRole }) => {
      const profile = await api.findProfileByEmail(input.email);
      if (!profile) throw new Error('No Vistoria account found for that email yet.');
      return api.addMember({ storyId, userId: profile.id, role: input.role, invitedBy: user!.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-members', storyId] });
    },
  });
}

export function useUpdateMemberRole(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role: StoryRole }) => api.updateMemberRole(storyId, input.userId, input.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-members', storyId] });
    },
  });
}

export function useRemoveMember(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.removeMember(storyId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-members', storyId] });
    },
  });
}
