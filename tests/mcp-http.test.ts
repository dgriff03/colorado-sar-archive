import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createMcpHandler } from '../mcp/http.ts';
import type { Incident } from '../lib/types.ts';

test('Hosted MCP handles stateless HTTP clients, tools, concurrency and invalid requests', async () => {
  const records: Incident[] = [
    {
      id: 'legacy-000001',
      date: '2025-01-01',
      summary: 'Injured hiker on Longs Peak',
      location: 'Longs Peak',
      county: 'Boulder',
      incident_type: 'injury',
      outcome: 'rescued',
      victims: 1,
      responding_agency: 'SAR',
      source_urls: 'https://example.org/report',
      notes: 'Uncertain detail',
    },
  ];
  const server = createServer(
    createMcpHandler(records, async () => records[0]),
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const url = new URL(
    `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/mcp`,
  );
  const client = new Client({ name: 'http-test', version: '1' });
  try {
    await client.connect(new StreamableHTTPClientTransport(url));
    assert.equal((await client.listTools()).tools.length, 3);
    const [search, groups] = await Promise.all([
      client.callTool({
        name: 'search_incidents',
        arguments: { location: 'Longs' },
      }),
      client.callTool({
        name: 'group_incidents',
        arguments: { by: 'outcome', then: 'location' },
      }),
    ]);
    assert.equal(
      (search.structuredContent as Record<string, unknown>)?.total,
      1,
    );
    assert.equal(
      (groups.structuredContent as Record<string, unknown>)?.total_incidents,
      1,
    );
    const detail = await client.callTool({
      name: 'get_incident',
      arguments: { id: 'legacy-000001' },
    });
    assert.equal(
      (
        (detail.structuredContent as Record<string, unknown>)
          ?.incident as Incident
      ).notes,
      'Uncertain detail',
    );
    assert.equal((await fetch(url)).status, 405);
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: {
            origin: 'https://untrusted.example',
            'Content-Type': 'application/json',
          },
          body: '{}',
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'x'.repeat(33000),
        })
      ).status,
      413,
    );
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{',
        })
      ).status,
      400,
    );
    assert.equal(
      (await fetch(url, { method: 'POST', body: '{}' })).status,
      415,
    );
    const options = await fetch(url, {
      method: 'OPTIONS',
      headers: { origin: 'https://claude.ai' },
    });
    assert.equal(options.status, 204);
    assert.equal(
      options.headers.get('Access-Control-Allow-Origin'),
      'https://claude.ai',
    );
  } finally {
    await client.close();
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
});
