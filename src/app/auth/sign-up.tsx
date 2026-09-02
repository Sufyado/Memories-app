import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { useI18n } from '@/lib/i18n';

export default function SignUpScreen() {
  const { t } = useI18n();
  const { signUp, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const { error: signUpError } = await signUp(email.trim(), password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    setInfo(t('auth.checkEmailToConfirm'));
  };

  return (
    <Screen title={t('auth.signUpTitle')} scroll={false}>
      {!isSupabaseConfigured ? (
        <ThemedText type="small" themeColor="danger">
          {t('auth.notConfiguredBody')}
        </ThemedText>
      ) : null}

      <Input
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.password')}
        autoCapitalize="none"
        autoComplete="password-new"
        secureTextEntry
      />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      {info ? (
        <ThemedText type="small" themeColor="success">
          {info}
        </ThemedText>
      ) : null}

      <Button
        label={t('auth.signUp')}
        onPress={handleSubmit}
        disabled={submitting || !email || !password}
      />

      <ThemedText
        type="link"
        themeColor="primary"
        style={styles.switchLink}
        onPress={() => router.replace('/auth/sign-in')}>
        {t('auth.haveAccount')}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchLink: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
