export function getShareUrl(slug: string): string {
  const webBase = process.env.EXPO_PUBLIC_WEB_BASE_URL;
  if (webBase) return `${webBase.replace(/\/$/, '')}/s/${slug}`;
  return `vistoria://s/${slug}`;
}
