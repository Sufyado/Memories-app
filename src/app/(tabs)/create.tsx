import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Screen } from '@/components/ui/screen';
import { SignInPrompt } from '@/components/ui/sign-in-prompt';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

export default function CreateScreen() {
  const { t } = useI18n();
  const { user } = useAuth();

  if (!user) {
    return (
      <Screen title={t('create.title')} scroll={false}>
        <SignInPrompt title={t('create.signInTitle')} subtitle={t('create.signInRequired')} />
      </Screen>
    );
  }

  return (
    <Screen title={t('create.title')} scroll={false}>
      <CreateOption
        icon={{ ios: 'play.rectangle.on.rectangle', android: 'video_library', web: 'video_library' }}
        title={t('create.newStory')}
        subtitle={t('create.newStorySubtitle')}
        onPress={() => router.push('/create/new-story')}
      />
      <CreateOption
        icon={{ ios: 'folder.badge.plus', android: 'create_new_folder', web: 'create_new_folder' }}
        title={t('create.newFolder')}
        subtitle={t('create.newFolderSubtitle')}
        onPress={() => router.push('/create/new-folder')}
      />
    </Screen>
  );
}

function CreateOption({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: Parameters<typeof SymbolView>[0]['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <ThemedView type="backgroundElement" style={[styles.card, pressed && styles.pressed]}>
          <ThemedView type="backgroundSelected" style={styles.iconWrap}>
            <SymbolView name={icon} size={22} tintColor={theme.primary} />
          </ThemedView>
          <ThemedView style={styles.textWrap}>
            <ThemedText type="smallBold">{title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  pressed: {
    opacity: 0.8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
});
