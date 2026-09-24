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
      .map(
        (item) =>
          `## ${item.question}\n\n${item.answer || 'Answer coming soon.'}`,
      )
      .join('\n\n') +
    '\n',
);
await writeFile(
  new URL('public/mcp/index.md', root),
  await readFile(new URL('docs/mcp.md', root), 'utf8'),
);
console.log('Built Markdown FAQ and MCP guide');
