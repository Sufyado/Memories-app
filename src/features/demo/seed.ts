import { File, Paths } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import { createFolder } from '@/features/folders/api';
import { createStory } from '@/features/stories/api';
import { createSlide } from '@/features/slides/api';
import { uploadMediaAsset } from '@/features/media/upload';
import { insertMediaRow } from '@/features/media/api';
import { ensureTag, attachTag } from '@/features/tags/api';
import { newBlockId } from '@/features/slides/blocks';
import type { Json } from '@/types/database';
import type { SlideBlock } from '@/types/domain';

type SlideSeed = {
  heading: string;
  body?: string;
  caption?: string;
  checklist?: string[];
  quote?: { text: string; author?: string };
  warning?: string;
  eventDate?: string;
  photoSeed?: string; // picsum.photos seed for a placeholder image; omit for text-only slides
};

const CASSIA_SLIDES: SlideSeed[] = [
  {
    heading: 'اختيار البذور',
    body: 'اختيار البذور الناضجة والممتلئة من نبات Cassia renigera صحي وقوي.',
    checklist: ['بذور داكنة اللون', 'قشرة صلبة بدون تشققات', 'خالية من آثار الحشرات'],
    photoSeed: 'cassia-1',
  },
  {
    heading: 'فحص البذور',
    body: 'فحص البذور قبل المعالجة واستبعاد أي بذرة تالفة أو فارغة.',
    photoSeed: 'cassia-2',
  },
  {
    heading: 'معالجة البذور',
    body: 'خدش القشرة الخارجية (Scarification) ثم نقعها في ماء دافئ لمدة 24 ساعة.',
    warning: 'لا تفرط في خدش القشرة حتى لا تتلف الجنين الداخلي.',
    photoSeed: 'cassia-3',
  },
  {
    heading: 'تجهيز الوسط',
    body: 'خليط من البيتموس والبيرلايت بنسبة 1:1، مع تعقيم الوسط قبل الزراعة.',
    photoSeed: 'cassia-4',
  },
  {
    heading: 'الزراعة',
    body: 'زراعة البذور على عمق ضعف حجمها تقريبًا، ثم الري برفق.',
    eventDate: '2026-03-01',
    photoSeed: 'cassia-5',
  },
  {
    heading: 'المتابعة',
    body: 'متابعة الرطوبة يوميًا والحفاظ على درجة حرارة ثابتة حول 25°م.',
    eventDate: '2026-03-15',
    photoSeed: 'cassia-6',
  },
  {
    heading: 'النتيجة',
    body: 'الإنبات بدأ بعد 12 يومًا بنسبة إنبات تقارب 80%.',
    quote: { text: 'الصبر هو المكوّن الأهم في أي تجربة إكثار.', author: 'دفتر الملاحظات' },
    eventDate: '2026-03-27',
    photoSeed: 'cassia-7',
  },
];

const NURSERY_DAY_SLIDES: SlideSeed[] = [
  {
    heading: 'الصباح في المشتل',
    body: 'يوم هادئ بدأ برائحة التراب المبلل بعد الري الصباحي.',
    eventDate: '2026-04-02',
    photoSeed: 'nursery-1',
  },
  {
    heading: 'جولة بين الأرفف',
    body: 'فحص سريع لكل الشتلات، وتدوين ملاحظات عن النمو.',
    photoSeed: 'nursery-2',
  },
  {
    heading: 'استراحة قهوة',
    caption: 'أفضل استراحة تكون وسط النباتات.',
    photoSeed: 'nursery-3',
  },
  {
    heading: 'زوار غير متوقعين',
    body: 'فراشة قررت الاستقرار على إحدى الشتلات لبضع دقائق.',
    photoSeed: 'nursery-4',
  },
  {
    heading: 'نهاية اليوم',
    body: 'يوم بسيط لكنه من الذكريات التي تستحق الأرشفة.',
    eventDate: '2026-04-02',
  },
];

function blocksFromSeed(seed: SlideSeed, mediaId: string | null): SlideBlock[] {
  const blocks: SlideBlock[] = [{ id: newBlockId(), type: 'heading', text: seed.heading }];
  if (mediaId) blocks.push({ id: newBlockId(), type: 'media', mediaId });
  if (seed.body) blocks.push({ id: newBlockId(), type: 'body', text: seed.body });
  if (seed.caption) blocks.push({ id: newBlockId(), type: 'caption', text: seed.caption });
  if (seed.checklist) {
    blocks.push({ id: newBlockId(), type: 'checklist', items: seed.checklist.map((text) => ({ text, done: false })) });
  }
  if (seed.quote) blocks.push({ id: newBlockId(), type: 'quote', text: seed.quote.text, author: seed.quote.author });
  if (seed.warning) blocks.push({ id: newBlockId(), type: 'warning', text: seed.warning });
  return blocks;
}

async function uploadPlaceholderPhoto(storyId: string, slideId: string, ownerId: string, seed: string): Promise<string | null> {
  try {
    const destination = new File(Paths.cache, `demo-${seed}.jpg`);
    const downloaded = await File.downloadFileAsync(`https://picsum.photos/seed/${seed}/900/1200`, destination, {
      idempotent: true,
    });
    const { mediaId, media } = await uploadMediaAsset(storyId, slideId, {
      uri: downloaded.uri,
      mediaType: 'image',
      mimeType: 'image/jpeg',
    });
    await insertMediaRow({
      id: mediaId,
      storyId,
      slideId,
      type: 'image',
      storagePath: media.storagePath,
      thumbnailPath: media.thumbnailPath,
      mimeType: 'image/jpeg',
      width: media.width,
      height: media.height,
      createdBy: ownerId,
    });
    return mediaId;
  } catch (err) {
    console.warn(`Demo seed: skipping placeholder photo for ${seed} (offline or blocked?)`, err);
    return null;
  }
}

async function seedStory(ownerId: string, folderId: string, title: string, description: string, slides: SlideSeed[]) {
  const story = await createStory({ ownerId, title, description, folderId });

  for (let i = 0; i < slides.length; i++) {
    const seed = slides[i];
    const slide = await createSlide({ storyId: story.id, position: i, eventDate: seed.eventDate ?? null });
    const mediaId = seed.photoSeed ? await uploadPlaceholderPhoto(story.id, slide.id, ownerId, seed.photoSeed) : null;

    const blocks = blocksFromSeed(seed, mediaId) as unknown as Json;
    await supabase.from('story_slides').update({ blocks, event_date: seed.eventDate ?? null }).eq('id', slide.id);
  }

  await supabase.from('stories').update({ status: 'published' }).eq('id', story.id);
  return story;
}

async function tagStory(ownerId: string, storyId: string, names: string[]) {
  for (const name of names) {
    const tag = await ensureTag(ownerId, name);
    await attachTag(storyId, tag.id);
  }
}

/** Seeds the two demo archives from the product spec (professional + personal use case). */
export async function loadDemoData(ownerId: string): Promise<void> {
  const propagationFolder = await createFolder({ name: 'إكثار البذور', ownerId });
  const cassiaStory = await seedStory(
    ownerId,
    propagationFolder.id,
    'Cassia renigera — تجربة الإكثار 2026',
    'تجربة إكثار Cassia renigera من البذور.',
    CASSIA_SLIDES,
  );
  await tagStory(ownerId, cassiaStory.id, ['Cassia', 'بذور', 'إكثار', 'تجربة']);

  const memoriesFolder = await createFolder({ name: 'ذكريات 2026', ownerId });
  const nurseryStory = await seedStory(
    ownerId,
    memoriesFolder.id,
    'يوم في المشتل',
    'ذكرى من يوم عادي في المشتل.',
    NURSERY_DAY_SLIDES,
  );
  await tagStory(ownerId, nurseryStory.id, ['ذكريات', 'المشتل']);
}
