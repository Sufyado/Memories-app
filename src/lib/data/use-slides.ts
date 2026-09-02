import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listMediaByIds } from '@/lib/data/media';
import { listSlides, reorderSlides } from '@/lib/data/slides';
import type { Media, StorySlide } from '@/types/domain';

export function useSlides(storyId: string | undefined) {
  const [slides, setSlides] = useState<StorySlide[]>([]);
  const [mediaById, setMediaById] = useState<Record<string, Media>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    try {
      const slideRows = await listSlides(storyId);
      setSlides(slideRows);
      const mediaIds = [...new Set(slideRows.map((s) => s.mediaId).filter((id): id is string => !!id))];
      const mediaRows = await listMediaByIds(mediaIds);
      setMediaById(Object.fromEntries(mediaRows.map((m) => [m.id, m])));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const move = useCallback(
    async (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= slides.length) return;
      const next = [...slides];
      [next[index], next[target]] = [next[target], next[index]];
      setSlides(next);
      try {
        await reorderSlides(next.map((s) => s.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        refresh();
      }
    },
    [slides, refresh],
  );

  return { slides, mediaById, loading, error, refresh, move };
}
