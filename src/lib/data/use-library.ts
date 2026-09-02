import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth/auth-provider';
import { countStoriesInFolder, listFolders } from '@/lib/data/folders';
import { listMyStories } from '@/lib/data/stories';
import type { Folder, Story } from '@/types/domain';

export type FolderWithCount = Folder & { storyCount: number };

export function useLibrary(folderId: string | null, options?: { storyLimit?: number }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [folderRows, storyRows] = await Promise.all([
        listFolders(folderId),
        listMyStories({ ownerId: user.id, folderId, limit: options?.storyLimit }),
      ]);
      const foldersWithCounts = await Promise.all(
        folderRows.map(async (folder) => ({
          ...folder,
          storyCount: await countStoriesInFolder(folder.id),
        })),
      );
      setFolders(foldersWithCounts);
      setStories(storyRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options is not expected to change identity per-render
  }, [folderId, user]);

  // Re-fetch whenever this screen regains focus (e.g. returning from
  // creating a folder/story), not just on first mount.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { folders, stories, loading, error, refresh };
}
