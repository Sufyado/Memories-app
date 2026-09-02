import { useMutation } from '@tanstack/react-query';

import { exportStoryAsJson } from './json';
import { exportStoryAsZip } from './zip';
import { exportStoryAsPdf } from './pdf';

export function useExportJson(storyId: string) {
  return useMutation({ mutationFn: () => exportStoryAsJson(storyId) });
}

export function useExportZip(storyId: string) {
  return useMutation({ mutationFn: () => exportStoryAsZip(storyId) });
}

export function useExportPdf(storyId: string) {
  return useMutation({ mutationFn: () => exportStoryAsPdf(storyId) });
}
