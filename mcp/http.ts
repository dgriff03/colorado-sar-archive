import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createArchiveServer } from './archive.ts';
import type { Incident } from '../lib/types.ts';

const allowedOrigins = new Set([
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
    let body = req.body;
    if (body === undefined) {
      const chunks: Buffer[] = [];
      let bytes = 0;
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
    const server = createArchiveServer(records, getDetail);
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch {
      if (!res.headersSent) res.writeHead(500).end('MCP request failed');
    } finally {
      await server.close();
    }
  };
}
