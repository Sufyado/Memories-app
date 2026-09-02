import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/lib/auth/auth-provider';
import { createFolder } from '@/lib/data/folders';
import { useI18n } from '@/lib/i18n';

export default function NewFolderScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createFolder({ name: name.trim(), parentFolderId: null, createdBy: user.id });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setSubmitting(false);
    }
  };

  return (
    <Screen title={t('newFolder.title')} showBackButton scroll={false}>
      <Input value={name} onChangeText={setName} placeholder={t('newFolder.namePlaceholder')} autoFocus />
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      <Button label={t('newFolder.create')} onPress={handleSubmit} disabled={submitting || !name.trim()} />
    </Screen>
  );
}
