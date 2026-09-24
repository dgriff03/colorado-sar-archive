import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createArchiveServer } from './archive.ts';
const directory = process.env.SAR_DATA_DIR
  ? resolve(process.env.SAR_DATA_DIR)
  : fileURLToPath(new URL('../public/data/', import.meta.url));
const records = JSON.parse(
  await readFile(resolve(directory, 'incidents.json'), 'utf8'),
);
const server = createArchiveServer(records, async (id) =>
  JSON.parse(
    await readFile(resolve(directory, 'incidents', `${id}.json`), 'utf8'),
  ),
);
await server.connect(new StdioServerTransport());
