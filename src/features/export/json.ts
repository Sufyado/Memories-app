import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { gatherStoryExportData } from './data';

function slugFileName(title: string): string {
  return (title || 'story').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'story';
}

/** Structured, portable copy of a story — everything a user needs to move their data elsewhere. */
export async function exportStoryAsJson(storyId: string): Promise<void> {
  const bundle = await gatherStoryExportData(storyId);

  const payload = {
    format: 'vistoria.story.v1',
    exported_at: new Date().toISOString(),
    story: bundle.story,
    slides: bundle.slides,
    media: bundle.media,
    tags: bundle.tags.map((t) => t.name),
  };

  const file = new File(Paths.cache, `${slugFileName(bundle.story.title)}.json`);
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: bundle.story.title });
  }
}
