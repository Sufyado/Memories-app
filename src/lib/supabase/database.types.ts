/**
 * Hand-written to mirror `supabase/migrations/*.sql` exactly (no live
 * Supabase project was available to run `supabase gen types` against in
 * this environment). If you change the SQL schema, update this file to
 * match, or regenerate it with:
 *
 *   supabase gen types typescript --db-url <your-db-url> --schema public
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StoryVisibility = 'private' | 'team' | 'link' | 'public';
export type StoryStatus = 'draft' | 'published' | 'archived';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      folders: {
        Row: {
          id: string;
          parent_folder_id: string | null;
          name: string;
          cover_media_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_folder_id?: string | null;
          name: string;
          cover_media_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['folders']['Insert']>;
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          folder_id: string | null;
          title: string;
          description: string | null;
          cover_media_id: string | null;
          created_by: string;
          updated_by: string;
          visibility: StoryVisibility;
          status: StoryStatus;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id?: string | null;
          title: string;
          description?: string | null;
          cover_media_id?: string | null;
          created_by: string;
          updated_by: string;
          visibility?: StoryVisibility;
          status?: StoryStatus;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stories']['Insert']>;
        Relationships: [];
      };
      story_slides: {
        Row: {
          id: string;
          story_id: string;
          order_index: number;
          media_id: string | null;
          media_type: 'image' | 'video' | null;
          blocks: Json;
          event_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          order_index: number;
          media_id?: string | null;
          media_type?: 'image' | 'video' | null;
          blocks?: Json;
          event_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['story_slides']['Insert']>;
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          story_id: string;
          slide_id: string | null;
          type: 'image' | 'video' | 'file';
          storage_path: string;
          mime_type: string;
          width: number | null;
          height: number | null;
          duration_ms: number | null;
          thumbnail_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          slide_id?: string | null;
          type: 'image' | 'video' | 'file';
          storage_path: string;
          mime_type: string;
          width?: number | null;
          height?: number | null;
          duration_ms?: number | null;
          thumbnail_path?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media']['Insert']>;
        Relationships: [];
      };
      tags: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
        Relationships: [];
      };
      story_tags: {
        Row: { story_id: string; tag_id: string };
        Insert: { story_id: string; tag_id: string };
        Update: Partial<Database['public']['Tables']['story_tags']['Insert']>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          story_id: string;
          slide_id: string | null;
          author_id: string;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          slide_id?: string | null;
          author_id: string;
          text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
        Relationships: [];
      };
      story_members: {
        Row: {
          story_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          story_id: string;
          user_id: string;
          role: 'owner' | 'editor' | 'viewer';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['story_members']['Insert']>;
        Relationships: [];
      };
      share_links: {
        Row: {
          id: string;
          story_id: string;
          slug: string;
          visibility: 'link' | 'public';
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          slug: string;
          visibility: 'link' | 'public';
          is_active?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['share_links']['Insert']>;
        Relationships: [];
      };
      story_versions: {
        Row: {
          id: string;
          story_id: string;
          version: number;
          updated_by: string;
          updated_at: string;
          snapshot: Json;
        };
        Insert: {
          id?: string;
          story_id: string;
          version: number;
          updated_by: string;
          updated_at?: string;
          snapshot: Json;
        };
        Update: Partial<Database['public']['Tables']['story_versions']['Insert']>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          story_id: string;
          actor_id: string;
          action:
            | 'story_created'
            | 'story_updated'
            | 'story_shared'
            | 'slide_added'
            | 'slide_edited'
            | 'slide_deleted';
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          actor_id: string;
          action:
            | 'story_created'
            | 'story_updated'
            | 'story_shared'
            | 'slide_added'
            | 'slide_edited'
            | 'slide_deleted';
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      story_role: {
        Args: { p_story_id: string; p_user_id: string };
        Returns: string | null;
      };
      story_is_shared_public: {
        Args: { p_story_id: string };
        Returns: boolean;
      };
      slide_blocks_text: {
        Args: { blocks: Json };
        Returns: string;
      };
      search_stories: {
        Args: { search_query: string };
        Returns: Database['public']['Tables']['stories']['Row'][];
      };
    };
    Enums: {
      story_visibility: StoryVisibility;
      story_status: StoryStatus;
    };
  };
};
