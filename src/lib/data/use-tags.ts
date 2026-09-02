import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { addTagToStory, listStoryTags, removeTagFromStory } from '@/lib/data/tags';
import type { Tag } from '@/types/domain';

export function useStoryTags(storyId: string | undefined) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    try {
      setTags(await listStoryTags(storyId));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const add = useCallback(
    async (name: string) => {
      if (!storyId || !name.trim()) return;
      const tag = await addTagToStory(storyId, name);
      setTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
    },
    [storyId],
  );

  const remove = useCallback(
    async (tagId: string) => {
      if (!storyId) return;
      await removeTagFromStory(storyId, tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    },
    [storyId],
  );

  return { tags, loading, refresh, add, remove };
}
