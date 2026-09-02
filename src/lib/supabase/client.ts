import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False when `.env` still has the placeholder values from `.env.example` (or is missing). */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'),
);

// Expo Router's static web export pre-renders routes in Node, which has no
// `window` — the web build of AsyncStorage assumes one and throws if it's
// used there. Only wire up device/browser storage when we're actually
// running in a browser or on a native device; during SSR, omit `storage`
// so supabase-js falls back to its own SSR-safe in-memory default.
const isServerSideRendering = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: isServerSideRendering ? undefined : AsyncStorage,
      autoRefreshToken: !isServerSideRendering,
      persistSession: !isServerSideRendering,
      detectSessionInUrl: Platform.OS === 'web' && !isServerSideRendering,
    },
  },
);
