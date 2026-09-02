import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { addComment, listComments } from '@/lib/data/comments';
import { listProfilesByIds, type Profile } from '@/lib/data/profiles';
import type { Comment } from '@/types/domain';

export function useComments(storyId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listComments(storyId);
      setComments(rows);
      const authorIds = [...new Set(rows.map((c) => c.authorId))];
      const profiles = await listProfilesByIds(authorIds);
      setProfilesById(Object.fromEntries(profiles.map((p) => [p.id, p])));
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

  const post = useCallback(
    async (authorId: string, text: string) => {
      if (!storyId || !text.trim()) return;
      const comment = await addComment(storyId, authorId, text);
      setComments((prev) => [...prev, comment]);
    },
    [storyId],
  );

  return { comments, profilesById, loading, error, refresh, post };
}
