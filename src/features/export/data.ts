import { supabase } from '@/lib/supabase';
import { listSlides } from '@/features/slides/api';
import { listMediaForStory } from '@/features/media/api';
import { listTagsForStory } from '@/features/tags/api';
import type { Story } from '@/types/domain';

export type StoryExportBundle = {
  story: Story;
  slides: Awaited<ReturnType<typeof listSlides>>;
  media: Awaited<ReturnType<typeof listMediaForStory>>;
  tags: Awaited<ReturnType<typeof listTagsForStory>>;
};

export async function gatherStoryExportData(storyId: string): Promise<StoryExportBundle> {
  const { data: story, error } = await supabase.from('stories').select('*').eq('id', storyId).single();
  if (error) throw error;

  const [slides, media, tags] = await Promise.all([
    listSlides(storyId),
    listMediaForStory(storyId),
    listTagsForStory(storyId),
  ]);

  return { story, slides, media, tags };
}
