import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export const STORY_MEDIA_BUCKET = 'story-media';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function getSignedMediaUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(STORY_MEDIA_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/** Storage is private; every read goes through a short-lived signed URL. */
export function useSignedMediaUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', path],
    queryFn: () => getSignedMediaUrl(path as string),
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
