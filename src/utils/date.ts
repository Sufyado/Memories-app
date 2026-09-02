import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

export function formatRelative(dateIso: string, locale: string): string {
  return dayjs(dateIso).locale(locale.startsWith('ar') ? 'ar' : 'en').fromNow();
}

export function formatDate(dateIso: string, locale: string): string {
  return dayjs(dateIso)
    .locale(locale.startsWith('ar') ? 'ar' : 'en')
    .format('D MMM YYYY');
}
