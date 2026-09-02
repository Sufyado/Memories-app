import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, WebTopNavInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';

export type ScreenProps = {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
  headerRight?: ReactNode;
  showBackButton?: boolean;
};

export function Screen({ title, children, scroll = true, headerRight, showBackButton }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const Container = scroll ? ScrollView : View;
  const paddingTop = insets.top + WebTopNavInset + Spacing.four;

  return (
    <ThemedView style={styles.root}>
      <Container
        style={styles.fill}
        contentContainerStyle={
          scroll
            ? [styles.scrollContent, { paddingTop, paddingBottom: BottomTabInset + Spacing.six }]
            : undefined
        }>
        <View style={[styles.inner, !scroll && { paddingTop, flex: 1 }]}>
          {title || showBackButton ? (
            <View style={styles.header}>
              {showBackButton ? <BackButton /> : null}
              <ThemedText type="title" style={[styles.headerTitle, styles.grow]} numberOfLines={1}>
                {title}
              </ThemedText>
              {headerRight}
            </View>
          ) : null}
          {children}
        </View>
      </Container>
    </ThemedView>
  );
}

function BackButton() {
  const theme = useTheme();
  const { isRTL } = useI18n();

  return (
    <Pressable accessibilityRole="button" onPress={() => router.back()}>
      <ThemedView type="backgroundElement" style={styles.backButtonInner}>
        <SymbolView
          name={{
            ios: isRTL ? 'chevron.right' : 'chevron.left',
            android: isRTL ? 'arrow_forward' : 'arrow_back',
            web: isRTL ? 'arrow_forward' : 'arrow_back',
          }}
          tintColor={theme.text}
          size={18}
        />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: Platform.select({ web: 'center', default: 'stretch' }),
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  grow: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
