import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

export default function HomeScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen
      title={t('home.title')}
      headerRight={
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/create')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <ThemedView type="backgroundElement" style={styles.addButtonInner}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={theme.text}
              size={20}
            />
          </ThemedView>
        </Pressable>
      }>
      <EmptyState
        icon={{ ios: 'photo.on.rectangle.angled', android: 'photo_library', web: 'photo_library' }}
        title={t('home.emptyTitle')}
        subtitle={t('home.emptySubtitle')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderRadius: Spacing.five,
  },
  addButtonInner: {
    width: 40,
    height: 40,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
