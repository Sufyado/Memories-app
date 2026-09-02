import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { uploadMediaAsset, type PickedAsset } from './upload';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Media } from '@/types/domain';

export function useMediaForStory(storyId: string | undefined) {
  return useQuery({
    queryKey: ['media', storyId],
    queryFn: () => api.listMediaForStory(storyId as string),
    enabled: !!storyId,
  });
}

/** Map keyed by media id, handy for resolving `{type:'media', mediaId}` slide blocks. */
export function useMediaMap(storyId: string | undefined): Record<string, Media> {
  const { data } = useMediaForStory(storyId);
  const map: Record<string, Media> = {};
  data?.forEach((m) => {
    map[m.id] = m;
  });
  return map;
}

export function useUploadMedia(storyId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { slideId: string; asset: PickedAsset; onProgress?: (fraction: number) => void }) => {
      const { mediaId, media } = await uploadMediaAsset(storyId, input.slideId, input.asset, input.onProgress);
      return api.insertMediaRow({
        id: mediaId,
        storyId,
        slideId: input.slideId,
        type: input.asset.mediaType,
        storagePath: media.storagePath,
        thumbnailPath: media.thumbnailPath,
        mimeType: input.asset.mimeType,
        width: media.width,
        height: media.height,
        durationMs: input.asset.durationMs,
        sizeBytes: input.asset.fileSize,
        createdBy: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', storyId] });
    },
  });
}

export function useDeleteMedia(storyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const deleted = await api.deleteMediaRow(mediaId);
      const paths = [deleted.storage_path, deleted.thumbnail_path].filter((p): p is string => !!p);
      await api.removeStorageObjects(paths);
      return deleted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', storyId] });
    },
  });
}
