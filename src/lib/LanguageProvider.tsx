import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { I18nManager, Platform } from 'react-native';

import i18n, { isRTL } from './i18n';
import { useSettingsStore } from '@/store/settings';

type LanguageState = {
  language: string;
  /** True right after a language switch that flipped writing direction and
   * needs a manual app restart to fully mirror native layout (RN can't hot
   * reload I18nManager.forceRTL). Ignored on web, which re-renders directly. */
  pendingRestart: boolean;
  setLanguage: (language: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSettingsStore((s) => s.language);
  const setLanguageInStore = useSettingsStore((s) => s.setLanguage);
  const [pendingRestart, setPendingRestart] = React.useState(false);

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  const value = useMemo<LanguageState>(
    () => ({
      language,
      pendingRestart,
      setLanguage: async (next: string) => {
        const wantsRTL = isRTL(next);
        setLanguageInStore(next);
        await i18n.changeLanguage(next);

        if (Platform.OS !== 'web' && I18nManager.isRTL !== wantsRTL) {
          I18nManager.allowRTL(wantsRTL);
          I18nManager.forceRTL(wantsRTL);
          // RN cannot flip native layout direction without a full JS reload.
          // The caller (Settings screen) should prompt the user to restart.
          setPendingRestart(true);
        }
      },
    }),
    [language, pendingRestart, setLanguageInStore],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
