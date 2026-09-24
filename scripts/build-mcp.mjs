import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const index = JSON.parse(
  await readFile(new URL('public/data/incidents.json', root), 'utf8'),
);
const records = await Promise.all(
  index.map((r) =>
    readFile(new URL(`public/data/incidents/${r.id}.json`, root), 'utf8').then(
      JSON.parse,
    ),
  ),
);
await mkdir(new URL('functions/lib/data/', root), { recursive: true });
await writeFile(
  new URL('functions/lib/data/records.json', root),
  JSON.stringify(records),
);
await build({
  entryPoints: [new URL('functions/index.ts', root).pathname],
  outfile: new URL('functions/lib/index.js', root).pathname,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  external: ['firebase-functions', 'firebase-functions/*'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
console.log(`Built hosted MCP with ${records.length} accepted records`);
