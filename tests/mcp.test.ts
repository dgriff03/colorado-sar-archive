import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP stdio handshake, search, pagination, details, groups and invalid inputs', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'sar-mcp-'));
  const records = [1, 2, 3].map((i) => ({
    id: i === 1 ? '11111111-1111-4111-8111-111111111111' : `legacy-00000${i}`,
    date: `2025-01-0${i}`,
    merged_ids: i === 1 ? ['legacy-000099'] : [],
    summary: 'Injured hiker on Longs Peak',
    location: i === 3 ? 'Boulder' : 'Longs Peak',
    county: 'Boulder',
    incident_type: 'injury',
    outcome: 'rescued',
    detail_score: i === 1 ? 'BASIC_FACTS' : null,
    responding_agency: 'Summit County SAR',
    source_urls: 'https://example.org/report',
  }));
  await mkdir(resolve(dir, 'incidents'));
  await writeFile(resolve(dir, 'incidents.json'), JSON.stringify(records));
  for (const r of records)
    await writeFile(
      resolve(dir, 'incidents', r.id + '.json'),
      JSON.stringify({ ...r, notes: 'Source uncertainty preserved' }),
    );
  const client = new Client({ name: 'archive-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--experimental-strip-types', resolve('mcp/server.ts')],
    env: { ...(process.env as Record<string, string>), SAR_DATA_DIR: dir },
    cwd: tmpdir(),
  });
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools.length, 3);
    const searched = await client.callTool({
      name: 'search_incidents',
      arguments: { query: 'injurd hiker', location: 'Longs', limit: 1 },
    });
    const data = searched.structuredContent as any;
    assert.equal(data.total, 2);
    assert.equal(data.next_offset, 1);
    assert.equal(data.incidents.length, 1);
    const next = (
      await client.callTool({
        name: 'search_incidents',
        arguments: {
          query: 'injurd hiker',
          location: 'Longs',
          limit: 1,
          offset: 1,
        },
      })
    ).structuredContent as any;
    assert.notEqual(next.incidents[0].id, data.incidents[0].id);
    const detail = (
      await client.callTool({
        name: 'get_incident',
        arguments: { id: data.incidents[0].id },
      })
    ).structuredContent as any;
    assert.equal(detail.incident.notes, 'Source uncertainty preserved');
    const merged = (await client.callTool({ name: 'get_incident', arguments: { id: 'legacy-000099' } })).structuredContent as any;
    assert.equal(merged.incident.id, '11111111-1111-4111-8111-111111111111');
    assert.ok(merged.url.endsWith('?incident=11111111-1111-4111-8111-111111111111'));

    const multi = (await client.callTool({ name: 'search_incidents', arguments: { month: [1, 6], detail_level: 'BASIC_FACTS', agency: 'SCRG' } })).structuredContent as any;
    assert.equal(multi.total, 1);
    assert.equal(multi.incidents[0].id, records[0].id);
    assert.equal((await client.callTool({ name: 'search_incidents', arguments: { month: [13] } })).isError, true);
    const filtered = (
      await client.callTool({
        name: 'search_incidents',
        arguments: {
          agency: 'missing',
          from: '2025-01-01',
          to: '2025-12-31',
          month: 1,
        },
      })
    ).structuredContent as any;
    assert.equal(filtered.total, 0);
    assert.equal(
      (
        await client.callTool({
          name: 'search_incidents',
          arguments: { query: 'x'.repeat(121) },
        })
      ).isError,
      true,
    );
    const grouped = (
      await client.callTool({
        name: 'group_incidents',
        arguments: { by: 'outcome', then: 'location' },
      })
    ).structuredContent as any;
    assert.equal(grouped.total_incidents, 3);
    assert.equal(grouped.groups[0].count, 2);
    assert.equal(
      (
        await client.callTool({
          name: 'get_incident',
          arguments: { id: 'legacy-999999' },
        })
      ).isError,
      true,
    );
    assert.equal(
      (
        await client.callTool({
          name: 'get_incident',
          arguments: { id: '../../etc/passwd' },
        })
      ).isError,
      true,
    );
    assert.equal(
      (
        await client.callTool({
          name: 'search_incidents',
          arguments: { limit: 101 },
        })
      ).isError,
      true,
    );
    assert.equal(
      (
        (
          await client.callTool({
            name: 'search_incidents',
            arguments: { year: 2020 },
          })
        ).structuredContent as any
      ).total,
      0,
    );
  } finally {
    await client.close();
    await rm(dir, { recursive: true, force: true });
  }
});
