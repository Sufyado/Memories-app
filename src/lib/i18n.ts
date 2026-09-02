import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ar from './locales/ar.json';

export const RTL_LANGUAGES = ['ar'];

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
const initialLanguage = RTL_LANGUAGES.includes(deviceLanguage) || deviceLanguage === 'en' ? deviceLanguage : 'en';

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function isRTL(language: string) {
  return RTL_LANGUAGES.includes(language);
}

export default i18next;
