import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Card, Chip, Screen, Text } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLanguage } from '@/lib/LanguageProvider';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { language, setLanguage, pendingRestart } = useLanguage();

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
        <Avatar name={fullName} size={72} />
        <Text variant="title" weight="semibold">
          {fullName}
        </Text>
        <Text variant="body" color="secondary">
          {user?.email}
        </Text>
      </View>

      <Card style={{ padding: 16, gap: 12 }}>
        <Text variant="label" weight="semibold" color="secondary">
          Language / اللغة
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="English" selected={language === 'en'} onPress={() => setLanguage('en')} />
          <Chip label="العربية" selected={language === 'ar'} onPress={() => setLanguage('ar')} />
        </View>
        {pendingRestart ? (
          <Text variant="caption" color="secondary">
            Restart the app to fully apply the new layout direction.
          </Text>
        ) : null}
      </Card>

      <Button label={t('auth.signOut')} variant="secondary" onPress={signOut} style={{ marginTop: 24 }} />
    </Screen>
  );
}
