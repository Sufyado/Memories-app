import { supabase } from '@/lib/supabase';
import type { StoryWithSlideCount } from '@/features/stories/api';

export async function searchStories(query: string): Promise<StoryWithSlideCount[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data: matches, error } = await supabase.rpc('search_stories', { p_query: trimmed });
  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  const orderedIds = matches.map((m) => m.story_id);
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*, story_slides(count)')
    .in('id', orderedIds);
  if (storiesError) throw storiesError;

  const byId = new Map((stories as unknown as (StoryWithSlideCount & { story_slides: { count: number }[] })[]).map((s) => [s.id, s]));
  return orderedIds
    .map((storyId) => byId.get(storyId))
    .filter((s): s is StoryWithSlideCount & { story_slides: { count: number }[] } => !!s)
    .map((s) => {
      const { story_slides, ...story } = s;
      return { ...story, slide_count: story_slides?.[0]?.count ?? 0 };
    });
}
