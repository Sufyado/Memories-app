import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/lib/auth/auth-provider';
import { I18nProvider } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <I18nProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth/sign-in" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth/sign-up" options={{ presentation: 'modal' }} />
            <Stack.Screen name="create/new-folder" options={{ presentation: 'modal' }} />
            <Stack.Screen name="create/new-story" options={{ presentation: 'modal' }} />
            <Stack.Screen name="library/[folderId]" />
            <Stack.Screen name="story/[id]/index" />
            <Stack.Screen name="story/[id]/view" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="story/[id]/comments" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
