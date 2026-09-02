import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { useAuth } from '@/features/auth/AuthProvider';

export function useFolders(parentFolderId: string | null = null) {
  return useQuery({
    queryKey: ['folders', parentFolderId],
    queryFn: () => api.listFolders(parentFolderId),
  });
}

export function useFolder(id: string | undefined) {
  return useQuery({
    queryKey: ['folder', id],
    queryFn: () => api.getFolder(id as string),
    enabled: !!id,
  });
}

export function useFolderStoryCount(folderId: string | undefined) {
  return useQuery({
    queryKey: ['folder-story-count', folderId],
    queryFn: () => api.countStoriesInFolder(folderId as string),
    enabled: !!folderId,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: { name: string; parentFolderId?: string | null }) =>
      api.createFolder({ name: input.name, ownerId: user!.id, parentFolderId: input.parentFolderId }),
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: ['folders', folder.parent_folder_id] });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) => api.renameFolder(input.id, input.name),
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: ['folders', folder.parent_folder_id] });
      queryClient.invalidateQueries({ queryKey: ['folder', folder.id] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
