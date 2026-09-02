import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LibraryLayout = 'grid' | 'list';

type SettingsState = {
  language: string;
  libraryLayout: LibraryLayout;
  setLanguage: (language: string) => void;
  setLibraryLayout: (layout: LibraryLayout) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      libraryLayout: 'grid',
      setLanguage: (language) => set({ language }),
      setLibraryLayout: (libraryLayout) => set({ libraryLayout }),
    }),
    {
      name: 'vistoria-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
