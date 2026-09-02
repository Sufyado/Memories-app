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
