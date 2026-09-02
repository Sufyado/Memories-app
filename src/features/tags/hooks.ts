import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { useAuth } from '@/features/auth/AuthProvider';

export function useTag(id: string | undefined) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => api.getTag(id as string),
    enabled: !!id,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.listTags(),
  });
}

export function useTagsForStory(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story-tags', storyId],
    queryFn: () => api.listTagsForStory(storyId as string),
    enabled: !!storyId,
  });
}

export function useStoriesForTag(tagId: string | undefined) {
  return useQuery({
    queryKey: ['stories-for-tag', tagId],
    queryFn: () => api.listStoriesForTag(tagId as string),
    enabled: !!tagId,
  });
}

export function useSetStoryTags(storyId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (names: string[]) => {
      const current = await api.listTagsForStory(storyId);
      const currentNames = new Set(current.map((t) => t.name));
      const nextNames = new Set(names.map((n) => n.trim()).filter(Boolean));

      const toAdd = [...nextNames].filter((n) => !currentNames.has(n));
      const toRemove = current.filter((t) => !nextNames.has(t.name));

      for (const name of toAdd) {
        const tag = await api.ensureTag(user!.id, name);
        await api.attachTag(storyId, tag.id);
      }
      for (const tag of toRemove) {
        await api.detachTag(storyId, tag.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-tags', storyId] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
