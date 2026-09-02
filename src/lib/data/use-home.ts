import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth/auth-provider';
import { countStoriesInFolder, listFolders } from '@/lib/data/folders';
import { listRecentStories } from '@/lib/data/stories';
import type { FolderWithCount } from '@/lib/data/use-library';
import type { Story } from '@/types/domain';

const RECENT_STORIES_LIMIT = 6;

export function useHomeData() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<FolderWithCount[]>([]);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setRecentStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [folderRows, storyRows] = await Promise.all([
        listFolders(null),
        listRecentStories(user.id, RECENT_STORIES_LIMIT),
      ]);
      const foldersWithCounts = await Promise.all(
        folderRows.map(async (folder) => ({ ...folder, storyCount: await countStoriesInFolder(folder.id) })),
      );
      setCollections(foldersWithCounts);
      setRecentStories(storyRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { collections, recentStories, loading, error, refresh };
}
