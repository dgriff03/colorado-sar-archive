import { DEFAULT_SITE_URL, normalizeSiteUrl } from './site-url.ts';

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);

export function siteDocumentation(text: string): string {
  return text.replaceAll(DEFAULT_SITE_URL, SITE_URL);
}
