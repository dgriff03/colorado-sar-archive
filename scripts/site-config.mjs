import { loadEnv } from 'vite';
import { normalizeSiteUrl } from '../lib/site-url.ts';

// Shell variables take precedence over .env.local and .env.
export const siteUrl = normalizeSiteUrl(loadEnv('production', process.cwd(), '').NEXT_PUBLIC_SITE_URL);
