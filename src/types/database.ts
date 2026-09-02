// Hand-written to mirror supabase/migrations/*.sql. If you have the Supabase
// CLI linked to a live project, prefer regenerating this with:
//   supabase gen types typescript --linked > src/types/database.ts
// and re-apply the SlideBlock union in domain.ts on top of the `blocks` jsonb column.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StoryStatus = 'draft' | 'published' | 'archived';
export type StoryVisibility = 'private' | 'team' | 'public';
export type StoryRole = 'owner' | 'editor' | 'viewer';
export type MediaType = 'image' | 'video' | 'file';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      folders: {
        Row: {
          id: string;
          owner_id: string;
          parent_folder_id: string | null;
          name: string;
          cover_storage_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          parent_folder_id?: string | null;
          name: string;
          cover_storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['folders']['Insert']>;
      };
      stories: {
        Row: {
          id: string;
          folder_id: string | null;
          owner_id: string;
          title: string;
          description: string | null;
          cover_storage_path: string | null;
          status: StoryStatus;
          visibility: StoryVisibility;
          version: number;
          slug: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id?: string | null;
          owner_id: string;
          title: string;
          description?: string | null;
          cover_storage_path?: string | null;
          status?: StoryStatus;
          visibility?: StoryVisibility;
          version?: number;
          slug?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stories']['Insert']>;
      };
      story_slides: {
        Row: {
          id: string;
          story_id: string;
          position: number;
          heading: string | null;
          body: string | null;
          caption: string | null;
          blocks: Json;
          event_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          position?: number;
          heading?: string | null;
          body?: string | null;
          caption?: string | null;
          blocks?: Json;
          event_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['story_slides']['Insert']>;
      };
      media: {
        Row: {
          id: string;
          story_id: string;
          slide_id: string | null;
          type: MediaType;
          storage_path: string;
          thumbnail_path: string | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          duration_ms: number | null;
          size_bytes: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          slide_id?: string | null;
          type: MediaType;
          storage_path: string;
          thumbnail_path?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration_ms?: number | null;
          size_bytes?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media']['Insert']>;
      };
      tags: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
      };
      story_tags: {
        Row: { story_id: string; tag_id: string };
        Insert: { story_id: string; tag_id: string };
        Update: Partial<Database['public']['Tables']['story_tags']['Insert']>;
      };
      comments: {
        Row: {
          id: string;
          story_id: string;
          slide_id: string | null;
          author_id: string;
          text: string;
          video_timestamp_ms: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          slide_id?: string | null;
          author_id: string;
          text: string;
          video_timestamp_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      story_members: {
        Row: {
          story_id: string;
          user_id: string;
          role: StoryRole;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          story_id: string;
          user_id: string;
          role: StoryRole;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['story_members']['Insert']>;
      };
      share_links: {
        Row: {
          id: string;
          story_id: string;
          slug: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          disabled_at: string | null;
        };
        Insert: {
          id?: string;
          story_id: string;
          slug: string;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          disabled_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['share_links']['Insert']>;
      };
      story_versions: {
        Row: {
          id: string;
          story_id: string;
          version: number;
          snapshot: Json;
          updated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          version: number;
          snapshot: Json;
          updated_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['story_versions']['Insert']>;
      };
      activity_log: {
        Row: {
          id: string;
          story_id: string | null;
          folder_id: string | null;
          actor_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id?: string | null;
          folder_id?: string | null;
          actor_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_stories: {
        Args: { p_query: string };
        Returns: { story_id: string; rank: number }[];
      };
      bump_story_version: {
        Args: { p_story_id: string; p_snapshot: Json };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
