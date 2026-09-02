import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Card, PromptModal, Screen, Text, useTheme } from '@/design-system';
import { useCreateFolder } from '@/features/folders/hooks';

export default function CreateScreen() {
  const { t } = useTranslation();
  const createFolder = useCreateFolder();
  const [newFolderVisible, setNewFolderVisible] = useState(false);

  return (
    <Screen>
      <View style={{ paddingTop: 12, paddingBottom: 24 }}>
        <Text variant="display" weight="bold">
          {t('nav.create')}
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <LaunchCard
          icon="sparkles"
          title={t('story.new')}
          description={t('story.addSlides')}
          onPress={() => router.push('/story/new')}
          primary
        />
        <LaunchCard
          icon="folder-outline"
          title={t('folder.new')}
          description={t('folder.name')}
          onPress={() => setNewFolderVisible(true)}
        />
      </View>

      <PromptModal
        visible={newFolderVisible}
        title={t('folder.new')}
        placeholder={t('folder.name')}
        onClose={() => setNewFolderVisible(false)}
        onSubmit={(name) => {
          createFolder.mutate({ name });
          setNewFolderVisible(false);
        }}
      />
    </Screen>
  );
}

function LaunchCard({
  icon,
  title,
  description,
  onPress,
  primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={{ padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: primary ? theme.colors.brand : theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={24} color={primary ? theme.colors.onBrand : theme.colors.textPrimary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="subtitle" weight="semibold">
          {title}
        </Text>
        <Text variant="caption" color="secondary">
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Card>
  );
}
