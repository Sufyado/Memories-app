import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { useAuth } from '@/features/auth/AuthProvider';

export function useRecentStories(limit = 10) {
  return useQuery({
    queryKey: ['stories', 'recent', limit],
    queryFn: () => api.listRecentStories(limit),
  });
}

export function useStories(folderId?: string | null) {
  return useQuery({
    queryKey: ['stories', 'list', folderId ?? 'all'],
    queryFn: () => api.listStories({ folderId }),
  });
}

export function useStory(id: string | undefined) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => api.getStory(id as string),
    enabled: !!id,
  });
}

export function useStoryBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['story-by-slug', slug],
    queryFn: () => api.getStoryBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: { title: string; description?: string | null; folderId?: string | null }) =>
      api.createStory({ ownerId: user!.id, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useUpdateStoryMeta() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: { id: string; patch: Parameters<typeof api.updateStoryMeta>[1] }) =>
      api.updateStoryMeta(input.id, input.patch, user!.id),
    onSuccess: (story) => {
      queryClient.invalidateQueries({ queryKey: ['story', story.id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function usePublishStoryVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; snapshot: Parameters<typeof api.publishStoryVersion>[1] }) =>
      api.publishStoryVersion(input.id, input.snapshot),
    onSuccess: (_version, input) => {
      queryClient.invalidateQueries({ queryKey: ['story', input.id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
