/**
 * Core domain model for Vistoria's Memory / Knowledge Object.
 * Mirrors the planned Supabase/Postgres schema (see README) so the app and
 * the database migrations (Phase 2) share one shape.
 */

export type UUID = string;
export type ISODateString = string;

export type Visibility = 'private' | 'team' | 'link' | 'public';
export type StoryStatus = 'draft' | 'published' | 'archived';
export type TeamRole = 'owner' | 'editor' | 'viewer';

export interface Folder {
  id: UUID;
  parentFolderId: UUID | null;
  name: string;
  coverMediaId: UUID | null;
  createdBy: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Story {
  id: UUID;
  folderId: UUID | null;
  title: string;
  description: string | null;
  coverMediaId: UUID | null;
  createdBy: UUID;
  createdAt: ISODateString;
  updatedBy: UUID;
  updatedAt: ISODateString;
  visibility: Visibility;
  status: StoryStatus;
  version: number;
}

export type SlideBlockType =
  | 'heading'
  | 'body'
  | 'caption'
  | 'checklist'
  | 'warning'
  | 'quote'
  | 'link'
  | 'file';

export interface SlideBlock {
  id: UUID;
  type: SlideBlockType;
  text?: string;
  url?: string;
  items?: { text: string; done: boolean }[];
}

export type SlideMediaType = 'image' | 'video' | null;

export interface StorySlide {
  id: UUID;
  storyId: UUID;
  order: number;
  mediaId: UUID | null;
  mediaType: SlideMediaType;
  blocks: SlideBlock[];
  eventDate: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Media {
  id: UUID;
  storyId: UUID;
  slideId: UUID | null;
  type: 'image' | 'video' | 'file';
  storagePath: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  thumbnailPath: string | null;
  createdAt: ISODateString;
}

export interface Tag {
  id: UUID;
  name: string;
}

export interface Comment {
  id: UUID;
  storyId: UUID;
  slideId: UUID | null;
  authorId: UUID;
  text: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface StoryMember {
  storyId: UUID;
  userId: UUID;
  role: TeamRole;
}

export interface ShareLink {
  id: UUID;
  storyId: UUID;
  slug: string;
  visibility: Extract<Visibility, 'link' | 'public'>;
  isActive: boolean;
  createdBy: UUID;
  createdAt: ISODateString;
}

export interface StoryVersion {
  id: UUID;
  storyId: UUID;
  version: number;
  updatedBy: UUID;
  updatedAt: ISODateString;
  snapshot: unknown;
}

export type ActivityAction =
  | 'story_created'
  | 'story_updated'
  | 'story_shared'
  | 'slide_added'
  | 'slide_edited'
  | 'slide_deleted';

export interface ActivityLogEntry {
  id: UUID;
  storyId: UUID;
  actorId: UUID;
  action: ActivityAction;
  createdAt: ISODateString;
  metadata: Record<string, unknown> | null;
}

/** A Story with its slides expanded, as consumed by the Story Viewer/Editor. */
export interface StoryWithSlides extends Story {
  slides: StorySlide[];
  tags: Tag[];
}
