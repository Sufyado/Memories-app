import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip, PromptModal } from '@/design-system';
import { useSetStoryTags, useTagsForStory } from '../hooks';

export function TagsEditor({ storyId }: { storyId: string }) {
  const { t } = useTranslation();
  const tags = useTagsForStory(storyId);
  const setTags = useSetStoryTags(storyId);
  const [adding, setAdding] = useState(false);

  const names = tags.data?.map((tag) => tag.name) ?? [];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {names.map((name) => (
        <Chip
          key={name}
          label={`#${name}`}
          selected
          onPress={() => setTags.mutate(names.filter((n) => n !== name))}
        />
      ))}
      <Chip
        label={`+ ${t('common.add')}`}
        onPress={() => setAdding(true)}
      />

      <PromptModal
        visible={adding}
        title={t('tags.new')}
        placeholder="tag"
        onClose={() => setAdding(false)}
        onSubmit={(name) => {
          setTags.mutate([...names, name]);
          setAdding(false);
        }}
      />
    </View>
  );
}
