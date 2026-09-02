import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { Comment } from '@/types/domain';

type CommentRow = Database['public']['Tables']['comments']['Row'];

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    storyId: row.story_id,
    slideId: row.slide_id,
    authorId: row.author_id,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listComments(storyId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapComment);
}

export async function addComment(storyId: string, authorId: string, text: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ story_id: storyId, author_id: authorId, text: text.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return mapComment(data);
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}
