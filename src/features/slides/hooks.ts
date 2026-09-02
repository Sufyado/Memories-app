import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import type { SlideBlock, StorySlideRow } from '@/types/domain';

export function useSlides(storyId: string | undefined) {
  return useQuery({
    queryKey: ['slides', storyId],
    queryFn: () => api.listSlides(storyId as string),
    enabled: !!storyId,
  });
}

export function useCreateSlide(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { position: number; blocks?: SlideBlock[]; eventDate?: string | null }) =>
      api.createSlide({ storyId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useUpdateSlideBlocks(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { slideId: string; blocks: SlideBlock[]; eventDate?: string | null }) =>
      api.updateSlideBlocks(input.slideId, input.blocks, input.eventDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', storyId] });
    },
  });
}

export function useDuplicateSlide(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { slide: StorySlideRow; newPosition: number }) => api.duplicateSlide(input.slide, input.newPosition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useDeleteSlide(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSlide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useReorderSlides(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.reorderSlides(storyId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', storyId] });
    },
  });
}
