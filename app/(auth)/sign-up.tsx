import React, { useState } from 'react';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Screen, Text } from '@/design-system';
import { useAuth } from '@/features/auth/AuthProvider';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUpWithPassword } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const { error: signUpError } = await signUpWithPassword(email.trim(), password, fullName.trim());
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
    } else {
      setSignedUp(true);
    }
  }

  if (signedUp) {
    return (
      <Screen contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
        <View style={{ gap: 12 }}>
          <Text variant="title" weight="semibold">
            {t('auth.welcome')}
          </Text>
          <Text variant="body" color="secondary">
            {t('auth.hasAccount')}
          </Text>
          <Link href="/(auth)/sign-in">
            <Text color="brand" weight="semibold">
              {t('auth.signIn')}
            </Text>
          </Link>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
      <View style={{ gap: 24 }}>
        <View style={{ gap: 6 }}>
          <Text variant="display" weight="bold">
            {t('auth.signUp')}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <Input label={t('auth.fullName')} value={fullName} onChangeText={setFullName} autoComplete="name" />
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
            textContentType="newPassword"
            error={error ?? undefined}
          />
        </View>

        <Button label={t('auth.signUp')} onPress={onSubmit} loading={loading} fullWidth size="lg" />

        <Link href="/(auth)/sign-in" style={{ alignSelf: 'center' }}>
          <Text color="secondary">
            {t('auth.hasAccount')} <Text color="brand" weight="semibold">{t('auth.signIn')}</Text>
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
