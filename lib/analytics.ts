import { SITE_URL } from './site.ts';
export function analyticsPage(url: string) {
  const u = new URL(url, SITE_URL);
  const path = ['/', '/faq/', '/mcp/'].includes(u.pathname) ? u.pathname : '/';
  // Never send query strings, record titles/IDs, hashes or external referrers.
  return {
    page_location: SITE_URL + path,
    page_title:
      path === '/' ? 'Explore archive' : path === '/faq/' ? 'FAQ' : 'MCP guide',
    page_referrer: '',
  };
}
