import type { Locale } from '@/lib/i18n';

const localeTag: Record<Locale, string> = { en: 'en-US', ar: 'ar' };

export function formatUpdatedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat(localeTag[locale], { hour: 'numeric', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat(localeTag[locale], { month: 'short', day: 'numeric' }).format(date);
}
