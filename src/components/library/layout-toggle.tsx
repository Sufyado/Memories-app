import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

import type { LibraryLayout } from './library-list';

export function LayoutToggle({
  layout,
  onChange,
}: {
  layout: LibraryLayout;
  onChange: (layout: LibraryLayout) => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.toggle}>
      <ToggleButton
        active={layout === 'grid'}
        label={t('library.grid')}
        icon={{ ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' }}
        onPress={() => onChange('grid')}
      />
      <ToggleButton
        active={layout === 'list'}
        label={t('library.list')}
        icon={{ ios: 'list.bullet', android: 'view_list', web: 'view_list' }}
        onPress={() => onChange('list')}
      />
    </View>
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
      <ThemedView type={active ? 'backgroundSelected' : undefined} style={styles.toggleButton}>
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
