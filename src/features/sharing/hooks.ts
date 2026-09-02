import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { useAuth } from '@/features/auth/AuthProvider';

export function useActiveShareLink(storyId: string | undefined) {
  return useQuery({
    queryKey: ['share-link', storyId],
    queryFn: () => api.getActiveShareLink(storyId as string),
    enabled: !!storyId,
  });
}

export function useCreateShareLink(storyId: string, title: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => api.createShareLink(storyId, title, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-link', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });
}

export function useSetShareLinkActive(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => api.setShareLinkActive(input.id, input.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-link', storyId] });
    },
  });
}
