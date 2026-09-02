import type { Database, MediaType, StoryRole, StoryStatus, StoryVisibility } from './database';

export type Folder = Database['public']['Tables']['folders']['Row'];
export type Story = Database['public']['Tables']['stories']['Row'];
export type StorySlideRow = Database['public']['Tables']['story_slides']['Row'];
export type Media = Database['public']['Tables']['media']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type StoryMember = Database['public']['Tables']['story_members']['Row'];
export type ShareLink = Database['public']['Tables']['share_links']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type { StoryStatus, StoryVisibility, StoryRole, MediaType };

// A Slide is not one fixed shape — it is an ordered list of content blocks.
// This is the core architectural decision from the spec: the same slide can
// carry a heading, an image, a paragraph, a video and a warning note, in any
// order, without schema changes. Stored in story_slides.blocks (jsonb).
export type SlideBlock =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'body'; text: string }
  | { id: string; type: 'caption'; text: string }
  | { id: string; type: 'media'; mediaId: string }
  | { id: string; type: 'checklist'; items: { text: string; done: boolean }[] }
  | { id: string; type: 'warning'; text: string }
  | { id: string; type: 'quote'; text: string; author?: string }
  | { id: string; type: 'link'; url: string; label?: string }
  | { id: string; type: 'file'; mediaId: string; label?: string };

export type StorySlide = StorySlideRow & { blocks: SlideBlock[] };

export function parseSlideBlocks(row: StorySlideRow): StorySlide {
  return { ...row, blocks: Array.isArray(row.blocks) ? (row.blocks as unknown as SlideBlock[]) : [] };
}
