import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { Locale, useI18n } from '@/lib/i18n';

export default function ProfileScreen() {
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const handleSetLocale = async (next: Locale) => {
    if (next === locale) return;
    const wasRTL = locale === 'ar';
    await setLocale(next);
    const isNowRTL = next === 'ar';
    if (Platform.OS !== 'web' && wasRTL !== isNowRTL) {
      Alert.alert(t('profile.language'), 'Restart the app to apply the new text direction.');
    }
  };

  return (
    <Screen title={t('profile.title')}>
      <Section title={t('profile.account')}>
        <ThemedView type="backgroundElement" style={styles.row}>
          <SymbolView
            name={{ ios: 'person.crop.circle', android: 'person', web: 'person' }}
            size={22}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
            {user?.email ?? t('profile.notSignedIn')}
          </ThemedText>
        </ThemedView>
        {user ? (
          <Button label={t('profile.signOut')} variant="secondary" onPress={() => signOut()} />
        ) : (
          <Button
            label={t('profile.signIn')}
            variant="secondary"
            onPress={() => router.push('/auth/sign-in')}
          />
        )}
      </Section>

      <Section title={t('profile.language')}>
        <View style={styles.pillRow}>
          <LanguagePill
            label="English"
            active={locale === 'en'}
            onPress={() => handleSetLocale('en')}
          />
          <LanguagePill
            label="العربية"
            active={locale === 'ar'}
            onPress={() => handleSetLocale('ar')}
          />
        </View>
      </Section>

      <Section title={t('profile.appearance')}>
        <ThemedText type="small" themeColor="textSecondary">
          {Platform.OS === 'web' ? 'Follows your system preference.' : 'Follows your device setting.'}
        </ThemedText>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function LanguagePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <ThemedView type={active ? 'backgroundSelected' : 'backgroundElement'} style={styles.pill}>
        <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  grow: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
});
