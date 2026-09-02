import { type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, WebTopNavInset } from '@/constants/theme';

export type ScreenProps = {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
  headerRight?: ReactNode;
};

export function Screen({ title, children, scroll = true, headerRight }: ScreenProps) {
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
          {title ? (
            <View style={styles.header}>
              <ThemedText type="title" style={styles.headerTitle}>
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
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
  },
});
