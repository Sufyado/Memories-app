import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

import { ar } from './locales/ar';
import { en, type TranslationSchema } from './locales/en';

export type Locale = 'en' | 'ar';

const RESOURCES: Record<Locale, TranslationSchema> = { en, ar };
const RTL_LOCALES: Locale[] = ['ar'];
const STORAGE_KEY = 'vistoria.locale';

type DotPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DotPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = DotPaths<TranslationSchema>;

function resolve(obj: unknown, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : path;
}

type I18nContextValue = {
  locale: Locale;
  isRTL: boolean;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function applyDirection(locale: Locale) {
  const isRTL = RTL_LOCALES.includes(locale);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
    return;
  }
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const initial: Locale = stored === 'en' || stored === 'ar' ? stored : 'ar';
      applyDirection(initial);
      setLocaleState(initial);
      setReady(true);
    });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: RTL_LOCALES.includes(locale),
      t: (key: TranslationKey) => resolve(RESOURCES[locale], key),
      setLocale: async (next: Locale) => {
        await AsyncStorage.setItem(STORAGE_KEY, next);
        applyDirection(next);
        setLocaleState(next);
      },
    }),
    [locale],
  );

  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
