import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export const STORY_MEDIA_BUCKET = 'story-media';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Storage is private; every read goes through a short-lived signed URL. */
export function useSignedMediaUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(STORY_MEDIA_BUCKET)
        .createSignedUrl(path as string, SIGNED_URL_TTL_SECONDS);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path,
    staleTime: (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000,
  });
}

export function storagePathFor(storyId: string, slideId: string, mediaId: string, ext: string) {
  return `${storyId}/${slideId}/${mediaId}.${ext}`;
}

export function thumbnailPathFor(storyId: string, slideId: string, mediaId: string) {
  return `${storyId}/${slideId}/${mediaId}_thumb.jpg`;
}

export function coverPathFor(storyId: string, ext: string) {
  return `${storyId}/cover.${ext}`;
}
