import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig, loadEnv } from 'vite';
import { normalizeSiteUrl } from './lib/site-url.ts';
export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NEXT_PUBLIC_SITE_URL': JSON.stringify(normalizeSiteUrl(loadEnv(mode, process.cwd(), '').NEXT_PUBLIC_SITE_URL)),
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext()],
}));
