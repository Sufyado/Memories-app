import '@/lib/i18n';
import 'react-native-reanimated';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/lib/queryClient';
import { LoadingView, ThemeProvider } from '@/design-system';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { LanguageProvider } from '@/lib/LanguageProvider';

function RootNavigator() {
  const { session, initializing } = useAuth();

  if (initializing) return <LoadingView />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="folder/[id]" />
        <Stack.Screen name="tag/[id]" />
        <Stack.Screen name="story/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="story/[id]/index" options={{ animation: 'fade' }} />
        <Stack.Screen name="story/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="story/[id]/share" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* Public web viewer: reachable with or without a session. */}
      <Stack.Screen name="s/[slug]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
