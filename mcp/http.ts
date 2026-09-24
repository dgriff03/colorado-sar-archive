import { SITE_URL } from '../lib/site.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createArchiveServer, createArchiveStore } from './archive.ts';
import type { Incident } from '../lib/types.ts';

const allowedOrigins = new Set([
  SITE_URL,
  'https://colorado-sar-archive.web.app',
  'https://colorado-sar-archive.firebaseapp.com',
  'https://claude.ai',
  'https://chatgpt.com',
]);
const maxBytes = 32 * 1024;
type Request = IncomingMessage & { body?: unknown; rawBody?: Buffer };
export function createMcpHandler(
  records: Incident[],
  getDetail: (id: string) => Promise<Incident>,
) {
  const store = createArchiveStore(records);
  let tokens = 40,
    lastRefill = Date.now(),
    active = 0;
  return async (req: Request, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      res.writeHead(403).end('Origin not allowed');
      return;
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id',
      );
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      res.writeHead(405).end('Use MCP Streamable HTTP POST');
      return;
    }
    if (
      !req.headers['content-type']?.toLowerCase().startsWith('application/json')
    ) {
      res.writeHead(415).end('Expected application/json');
      return;
    }
    if (
      Number(req.headers['content-length'] || 0) > maxBytes ||
      (req.rawBody?.length || 0) > maxBytes
    ) {
      res.writeHead(413).end('Request too large');
      return;
    }
    const now = Date.now();
    tokens = Math.min(40, tokens + ((now - lastRefill) / 1000) * 20);
    lastRefill = now;
    if (tokens < 1 || active >= 10) {
      res.setHeader('Retry-After', '1');
      res.writeHead(429).end('Server busy; retry later');
      return;
    }
    tokens--;
    active++;
    try {
      let body = req.body;
      if (body === undefined) {
        const chunks: Buffer[] = [];
        let bytes = 0;
        req.setTimeout(5000, () => req.destroy());
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > maxBytes) {
            res.writeHead(413).end('Request too large');
            return;
          }
          chunks.push(Buffer.from(chunk));
        }
        try {
          body = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          res.writeHead(400).end('Invalid JSON');
          return;
        }
      }
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      const server = createArchiveServer(records, getDetail, store);
      try {
        await server.connect(transport);
        await transport.handleRequest(req, res, body);
      } catch {
        if (!res.headersSent) res.writeHead(500).end('MCP request failed');
      } finally {
        await server.close();
      }
    } catch {
      if (!res.headersSent)
        res.writeHead(400).end('Invalid or interrupted request');
    } finally {
      active--;
    }
  };
}
