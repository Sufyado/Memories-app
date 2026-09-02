import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/lib/auth/auth-provider';
import { createStory } from '@/lib/data/stories';
import { useI18n } from '@/lib/i18n';

export default function NewStoryScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const story = await createStory({ title: title.trim(), folderId: null, createdBy: user.id });
      router.replace(`/story/${story.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t('newStory.title')} showBackButton scroll={false}>
      <Input value={title} onChangeText={setTitle} placeholder={t('newStory.titlePlaceholder')} autoFocus />
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      <Button label={t('newStory.create')} onPress={handleSubmit} disabled={submitting || !title.trim()} />
    </Screen>
  );
}
