import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { useAuth } from '@/features/auth/AuthProvider';

export function useComments(storyId: string | undefined) {
  return useQuery({
    queryKey: ['comments', storyId],
    queryFn: () => api.listComments(storyId as string),
    enabled: !!storyId,
  });
}

export function useAddComment(storyId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (text: string) => api.addComment({ storyId, authorId: user!.id, text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', storyId] });
    },
  });
}

export function useDeleteComment(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', storyId] });
    },
  });
}
