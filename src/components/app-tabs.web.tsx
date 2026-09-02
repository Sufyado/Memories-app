import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

const TAB_ICONS: Record<string, SymbolViewProps['name']> = {
  home: { ios: 'house', android: 'home', web: 'home' },
  library: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  create: { ios: 'plus.circle', android: 'add_circle', web: 'add_circle' },
  profile: { ios: 'person.crop.circle', android: 'person', web: 'person' },
};

const COMPACT_BREAKPOINT = 560;

export default function AppTabs() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BREAKPOINT;

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton name="home" compact={compact} label={t('tabs.home')} />
          </TabTrigger>
          <TabTrigger name="library" href="/library" asChild>
            <TabButton name="library" compact={compact} label={t('tabs.library')} />
          </TabTrigger>
          <TabTrigger name="search" href="/search" asChild>
            <TabButton name="search" compact={compact} label={t('tabs.search')} />
          </TabTrigger>
          <TabTrigger name="create" href="/create" asChild>
            <TabButton name="create" compact={compact} label={t('tabs.create')} />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton name="profile" compact={compact} label={t('tabs.profile')} />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  isFocused,
  name,
  label,
  compact,
  ...props
}: TabTriggerSlotProps & { name: string; label: string; compact: boolean }) {
  const theme = useTheme();
  return (
    <Pressable {...props} accessibilityLabel={label} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : undefined}
        style={styles.tabButtonView}>
        <SymbolView
          name={TAB_ICONS[name]}
          tintColor={isFocused ? theme.text : theme.textSecondary}
          size={18}
        />
        {compact ? null : (
          <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
            {label}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
