import React, { useState } from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signInWithPassword(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
  }

  return (
    <Screen scroll contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={{ gap: 24 }}>
        <View style={{ gap: 6 }}>
          <Text variant="display" weight="bold">
            {t('auth.welcome')}
          </Text>
          <Text variant="body" color="secondary">
            {t('auth.tagline')}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            error={error ?? undefined}
          />
        </View>

        <Button label={t('auth.signIn')} onPress={onSubmit} loading={loading} fullWidth size="lg" />

        <Link href="/(auth)/sign-up" style={{ alignSelf: 'center' }}>
          <Text color="secondary">
            {t('auth.noAccount')} <Text color="brand" weight="semibold">{t('auth.signUp')}</Text>
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
