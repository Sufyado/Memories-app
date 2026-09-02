import * as Crypto from 'expo-crypto';

import type { SlideBlock } from '@/types/domain';

export function newBlockId(): string {
  return Crypto.randomUUID();
}

/** Denormalized heading/body/caption kept in sync with `blocks` for fast full-text search. */
export function deriveSearchFields(blocks: SlideBlock[]): { heading: string | null; body: string | null; caption: string | null } {
  const heading = blocks.find((b): b is Extract<SlideBlock, { type: 'heading' }> => b.type === 'heading')?.text ?? null;
  const caption = blocks.find((b): b is Extract<SlideBlock, { type: 'caption' }> => b.type === 'caption')?.text ?? null;
  const bodyParts = blocks
    .filter((b): b is Extract<SlideBlock, { type: 'body' }> => b.type === 'body')
    .map((b) => b.text)
    .filter(Boolean);
  return { heading, body: bodyParts.length ? bodyParts.join('\n\n') : null, caption };
}

export function mediaBlockIds(blocks: SlideBlock[]): string[] {
  return blocks
    .filter((b): b is Extract<SlideBlock, { type: 'media' }> | Extract<SlideBlock, { type: 'file' }> => b.type === 'media' || b.type === 'file')
    .map((b) => b.mediaId);
}

/**
 * The editor works against a flat form (one media, one heading/body/caption,
 * an optional checklist/quote/warning/link) rather than a freeform block
 * list — simpler to build correctly, while the data model underneath still
 * allows richer freeform layouts for a future editor iteration. This is the
 * two-way mapping between that form and the stored `blocks` array.
 */
export type SlideForm = {
  mediaId: string | null;
  heading: string;
  body: string;
  caption: string;
  checklist: { text: string; done: boolean }[] | null;
  quote: { text: string; author: string } | null;
  warning: string | null;
  link: { url: string; label: string } | null;
};

export function emptySlideForm(): SlideForm {
  return { mediaId: null, heading: '', body: '', caption: '', checklist: null, quote: null, warning: null, link: null };
}

export function blocksToForm(blocks: SlideBlock[]): SlideForm {
  const form = emptySlideForm();
  for (const block of blocks) {
    if (block.type === 'media') form.mediaId = block.mediaId;
    else if (block.type === 'heading') form.heading = block.text;
    else if (block.type === 'body') form.body = block.text;
    else if (block.type === 'caption') form.caption = block.text;
    else if (block.type === 'checklist') form.checklist = block.items;
    else if (block.type === 'quote') form.quote = { text: block.text, author: block.author ?? '' };
    else if (block.type === 'warning') form.warning = block.text;
    else if (block.type === 'link') form.link = { url: block.url, label: block.label ?? '' };
  }
  return form;
}

export function formToBlocks(form: SlideForm): SlideBlock[] {
  const blocks: SlideBlock[] = [];
  if (form.heading.trim()) blocks.push({ id: newBlockId(), type: 'heading', text: form.heading.trim() });
  if (form.mediaId) blocks.push({ id: newBlockId(), type: 'media', mediaId: form.mediaId });
  if (form.body.trim()) blocks.push({ id: newBlockId(), type: 'body', text: form.body.trim() });
  if (form.caption.trim()) blocks.push({ id: newBlockId(), type: 'caption', text: form.caption.trim() });
  if (form.checklist && form.checklist.length > 0) {
    blocks.push({ id: newBlockId(), type: 'checklist', items: form.checklist });
  }
  if (form.quote && form.quote.text.trim()) {
    blocks.push({ id: newBlockId(), type: 'quote', text: form.quote.text.trim(), author: form.quote.author.trim() || undefined });
  }
  if (form.warning && form.warning.trim()) {
    blocks.push({ id: newBlockId(), type: 'warning', text: form.warning.trim() });
  }
  if (form.link && form.link.url.trim()) {
    blocks.push({ id: newBlockId(), type: 'link', url: form.link.url.trim(), label: form.link.label.trim() || undefined });
  }
  return blocks;
}

export function isSlideFormEmpty(form: SlideForm): boolean {
  return (
    !form.mediaId &&
    !form.heading.trim() &&
    !form.body.trim() &&
    !form.caption.trim() &&
    !(form.checklist && form.checklist.length > 0) &&
    !(form.quote && form.quote.text.trim()) &&
    !(form.warning && form.warning.trim()) &&
    !(form.link && form.link.url.trim())
  );
}
