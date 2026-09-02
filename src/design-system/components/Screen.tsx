import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../ThemeProvider';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
};

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  padded = true,
  refreshing,
  onRefresh,
  contentContainerStyle,
}: ScreenProps) {
  const theme = useTheme();

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        padded ? styles.padded : undefined,
        { flexGrow: 1 },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand}
          />
        ) : undefined
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded ? styles.padded : undefined]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
});
