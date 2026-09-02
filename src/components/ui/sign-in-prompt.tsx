import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

export function SignInPrompt({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
        {subtitle}
      </ThemedText>
      <Button label={t('profile.signIn')} onPress={() => router.push('/auth/sign-in')} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.two,
  },
});
