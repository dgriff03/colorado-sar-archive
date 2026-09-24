export const DEFAULT_SITE_URL = 'https://rescue.typetwo.dev';

/** All public links are rooted at an HTTP(S) origin, never a subdirectory. */
export function normalizeSiteUrl(value: string = DEFAULT_SITE_URL): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, a path, query or fragment');
  }
  return url.origin;
}
