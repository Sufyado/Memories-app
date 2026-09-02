import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/domain';

export type CommentWithAuthor = Comment & { author: { full_name: string | null; avatar_url: string | null } | null };

export async function listComments(storyId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(full_name, avatar_url)')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as unknown as CommentWithAuthor[];
}

export async function addComment(input: { storyId: string; authorId: string; text: string }): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ story_id: input.storyId, author_id: input.authorId, text: input.text })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}
