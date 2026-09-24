import { onRequest } from 'firebase-functions/v2/https';
import { readFileSync } from 'node:fs';
import { createMcpHandler } from '../mcp/http.ts';
import type { Incident } from '../lib/types.ts';
const records: Incident[] = JSON.parse(
  readFileSync(new URL('./data/records.json', import.meta.url), 'utf8'),
);
const details = new Map(records.map((record) => [record.id, record]));
const handler = createMcpHandler(records, async (id) => details.get(id)!);
export const sarMcp = onRequest(
  {
    region: 'us-central1',
    minInstances: 0,
    maxInstances: 2,
    concurrency: 20,
    memory: '256MiB',
    timeoutSeconds: 30,
    invoker: 'public',
    cors: false,
  },
  handler,
);
