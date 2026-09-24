import { siteUrl } from './site-config.mjs';
import { DEFAULT_SITE_URL } from '../lib/site-url.ts';
const customize = (text) => text.replaceAll(DEFAULT_SITE_URL, siteUrl);
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const faq = JSON.parse(
  await readFile(new URL('content/faq.json', root), 'utf8'),
);
await mkdir(new URL('public/faq/', root), { recursive: true });
await mkdir(new URL('public/mcp/', root), { recursive: true });
await writeFile(
  new URL('public/faq/index.md', root),
  '# Colorado SAR Archive FAQ\n\n' +
    faq
      .filter((item) => item.answer.trim())
      .map(
        (item) =>
          `## ${item.question}\n\n${item.answer}`,
      )
      .join('\n\n') +
    '\n',
);
await writeFile(
  new URL('public/mcp/index.md', root),
  customize(await readFile(new URL('docs/mcp.md', root), 'utf8')),
);
console.log('Built Markdown FAQ and MCP guide');

for (const file of ['llms.txt', 'data-guide.md']) {
  await writeFile(new URL(`public/${file}`, root), customize(await readFile(new URL(`content/${file}`, root), 'utf8')));
}
