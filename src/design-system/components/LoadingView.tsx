import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../ThemeProvider';

export function LoadingView() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.brand} size="large" />
    </View>
  );
}
