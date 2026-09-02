import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

type LibraryLayout = 'grid' | 'list';

export default function LibraryScreen() {
  const { t } = useI18n();
  const [layout, setLayout] = useState<LibraryLayout>('grid');

  return (
    <Screen
      title={t('library.title')}
      headerRight={
        <View style={styles.toggle}>
          <ToggleButton
            active={layout === 'grid'}
            label={t('library.grid')}
            icon={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
            onPress={() => setLayout('grid')}
          />
          <ToggleButton
            active={layout === 'list'}
            label={t('library.list')}
            icon={{ ios: 'list.bullet', android: 'view_list', web: 'view_list' }}
            onPress={() => setLayout('list')}
          />
        </View>
      }>
      <EmptyState
        icon={{ ios: 'folder', android: 'folder', web: 'folder' }}
        title={t('library.emptyTitle')}
        subtitle={t('library.emptySubtitle')}
      />
    </Screen>
  );
}

function ToggleButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: Parameters<typeof SymbolView>[0]['name'];
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <ThemedView
        type={active ? 'backgroundSelected' : undefined}
        style={styles.toggleButton}>
        <SymbolView name={icon} size={14} tintColor={active ? theme.text : theme.textSecondary} />
        <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
});
