import JSZip from 'jszip';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { gatherStoryExportData } from './data';
import { getSignedMediaUrl } from '@/features/media/storage';

function slugFileName(title: string): string {
  return (title || 'story').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'story';
}

function extensionFromPath(path: string): string {
  const ext = path.split('.').pop();
  return ext && ext.length <= 5 ? ext : 'bin';
}

/** story.json + media/ — a self-contained archive the user can open outside Vistoria. */
export async function exportStoryAsZip(storyId: string, onProgress?: (fraction: number) => void): Promise<void> {
  const bundle = await gatherStoryExportData(storyId);
  const zip = new JSZip();

  zip.file(
    'story.json',
    JSON.stringify(
      {
        format: 'vistoria.story.v1',
        exported_at: new Date().toISOString(),
        story: bundle.story,
        slides: bundle.slides,
        media: bundle.media,
        tags: bundle.tags.map((t) => t.name),
      },
      null,
      2,
    ),
  );

  const mediaFolder = zip.folder('media');
  for (let i = 0; i < bundle.media.length; i++) {
    const media = bundle.media[i];
    try {
      const signedUrl = await getSignedMediaUrl(media.storage_path);
      const response = await fetch(signedUrl);
      const bytes = await response.arrayBuffer();
      mediaFolder?.file(`${media.id}.${extensionFromPath(media.storage_path)}`, bytes);
    } catch (err) {
      console.warn(`Skipping media ${media.id} in export`, err);
    }
    onProgress?.((i + 1) / Math.max(bundle.media.length, 1));
  }

  const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const file = new File(Paths.cache, `${slugFileName(bundle.story.title)}.zip`);
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/zip', dialogTitle: bundle.story.title });
  }
}
