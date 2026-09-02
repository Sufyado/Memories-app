import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { gatherStoryExportData } from './data';
import { getSignedMediaUrl } from '@/features/media/storage';
import { parseSlideBlocks, type SlideBlock } from '@/types/domain';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function blockToHtml(block: SlideBlock, mediaUrl: string | null): string {
  switch (block.type) {
    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'body':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'caption':
      return `<p class="caption">${escapeHtml(block.text)}</p>`;
    case 'media':
      return mediaUrl ? `<img src="${mediaUrl}" />` : '';
    case 'quote':
      return `<blockquote>“${escapeHtml(block.text)}”${block.author ? `<footer>— ${escapeHtml(block.author)}</footer>` : ''}</blockquote>`;
    case 'warning':
      return `<div class="warning">⚠ ${escapeHtml(block.text)}</div>`;
    case 'checklist':
      return `<ul class="checklist">${block.items.map((i) => `<li>${i.done ? '☑' : '☐'} ${escapeHtml(i.text)}</li>`).join('')}</ul>`;
    case 'link':
      return `<p><a href="${block.url}">${escapeHtml(block.label ?? block.url)}</a></p>`;
    case 'file':
      return `<p class="caption">📎 ${escapeHtml(block.label ?? 'Attachment')}</p>`;
    default:
      return '';
  }
}

/** Renders the story as a linear, readable PDF — one section per slide. */
export async function exportStoryAsPdf(storyId: string): Promise<void> {
  const bundle = await gatherStoryExportData(storyId);
  const slides = bundle.slides.map(parseSlideBlocks);
  const mediaById = new Map(bundle.media.map((m) => [m.id, m]));

  const slideSections = await Promise.all(
    slides.map(async (slide) => {
      const blocksHtml = await Promise.all(
        slide.blocks.map(async (block) => {
          if (block.type === 'media' || block.type === 'file') {
            const media = mediaById.get(block.mediaId);
            const url = media ? await getSignedMediaUrl(media.storage_path).catch(() => null) : null;
            return blockToHtml(block, url);
          }
          return blockToHtml(block, null);
        }),
      );
      return `<section class="slide">${blocksHtml.join('\n')}</section>`;
    }),
  );

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 24px; }
          h1 { font-size: 26px; margin-bottom: 4px; }
          .description { color: #555; margin-bottom: 24px; }
          .slide { padding: 16px 0; border-bottom: 1px solid #eee; page-break-inside: avoid; }
          .slide img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
          .slide h2 { font-size: 18px; margin: 0 0 6px; }
          .slide p { line-height: 1.5; }
          .caption { color: #777; font-style: italic; font-size: 13px; }
          .warning { background: #fff4e0; border: 1px solid #f0b429; border-radius: 8px; padding: 8px 12px; }
          blockquote { border-left: 3px solid #ccc; margin: 8px 0; padding-left: 12px; font-style: italic; }
          .checklist { list-style: none; padding-left: 0; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(bundle.story.title || 'Untitled')}</h1>
        ${bundle.story.description ? `<p class="description">${escapeHtml(bundle.story.description)}</p>` : ''}
        ${slideSections.join('\n')}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: bundle.story.title });
  }
}
