import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSearch, defaults, sourceLinks } from '../lib/search.ts';
import type { Incident } from '../lib/types.ts';
const records = [
  {
    id: 'a',
    date: '2025-01-01',
    summary: 'Injured climber on Longs Peak',
    location: 'Keyhole Route',
    county: 'Larimer',
    incident_type: 'injury',
    peak: 'Longs Peak',
  },
  {
    id: 'b',
    date: '2026-02-01',
    summary: 'Lost hiker near Chautauqua',
    location: 'Flatirons',
    county: 'Boulder',
    incident_type: 'lost/stranded',
  },
  {
    id: 'c',
    date: '2026-03-01',
    summary: 'Avalanche on Quandary Peak',
    location: 'Quandary Peak',
    county: 'Summit',
    incident_type: 'avalanche',
  },
] as Incident[];
const search = createSearch(records);
test('fuzzy title tolerates a misspelling', () =>
  assert.equal(
    search({ ...defaults, q: 'injurd climber', sort: 'relevance' })[0].id,
    'a',
  ));
test('location matches peak and county case-insensitively', () => {
  assert.equal(search({ ...defaults, location: 'LONGS' })[0].id, 'a');
  assert.equal(search({ ...defaults, location: 'boulder' })[0].id, 'b');
});
test('filters intersect and empty results stay empty', () =>
  assert.equal(
    search({ ...defaults, location: 'Boulder', type: 'avalanche' }).length,
    0,
  ));
test('year and sort order', () => {
  assert.deepEqual(
    search(defaults).map((r) => r.id),
    ['c', 'b', 'a'],
  );
  assert.deepEqual(
    search({ ...defaults, year: '2026', sort: 'oldest' }).map((r) => r.id),
    ['b', 'c'],
  );
});
test('only safe HTTP source links are rendered', () =>
  assert.deepEqual(
    sourceLinks(
      'https://example.org|javascript:alert(1)|not a url|http://example.com',
    ),
    ['https://example.org', 'http://example.com'],
  ));

import { registerArchiveTool } from '../lib/webmcp.ts';
test('optional agent tool validates input and shares search state', () => {
  let tool: any, signal: AbortSignal | undefined, applied: any;
  const cleanup = registerArchiveTool(
    {
      registerTool: (t, o) => {
        tool = t;
        signal = o.signal;
      },
    },
    search,
    (f) => {
      applied = f;
    },
  );
  assert.equal(tool.name, 'search_sar_archive');
  assert.equal(tool.annotations.untrustedContentHint, true);
  const response = tool.execute({ title: 'injurd climber', location: 'Longs' });
  assert.equal(response.count, 1);
  assert.equal(applied.location, 'Longs');
  assert.throws(() => tool.execute({ location: 5 }));
  assert.throws(() => tool.execute({ title: 'x', unexpected: 'x' }));
  assert.equal(applied.location, 'Longs');
  cleanup?.();
  assert.equal(signal?.aborted, true);
});
test('unsupported agent browser is harmless', () =>
  assert.equal(
    registerArchiveTool(undefined, search, () => {}),
    undefined,
  ));

import { displayValue } from '../lib/search.ts';
test('notes, combined filters, multiple types, date range and location aliases', () => {
  const dataset = [
    {
      ...records[0],
      notes: 'Hypothermia treated with warming equipment',
      location: 'Mount Elbert',
      outcome: 'injury',
      responding_agency: 'Lake County SAR',
      setting: 'wilderness',
      place_type: 'peak',
    },
    { ...records[1], outcome: 'rescued' },
  ] as Incident[];
  const run = createSearch(dataset);
  assert.equal(run({ ...defaults, q: 'hypothermia' })[0].id, 'a');
  assert.equal(
    run({
      ...defaults,
      location: 'Mt. Elbert',
      outcome: 'injury',
      agency: 'LAKE',
      type: 'fall,injury',
      from: '2024-12-01',
      to: '2025-02-01',
      month: '01',
      setting: 'wilderness',
      placeType: 'peak',
    }).length,
    1,
  );
  assert.equal(
    run({ ...defaults, from: '2026-01-01', to: '2025-01-01' }).length,
    0,
  );
  assert.equal(run({ ...defaults, type: 'fall,avalanche' }).length, 0);
  assert.equal(
    run({ ...defaults, q: 'Hypothermia treated with warming equipment' })
      .length,
    1,
  );
  assert.equal(run({ ...defaults, q: 'x'.repeat(300) }).length, 0);
});
test('blank values are explicit and zero remains zero', () => {
  assert.equal(displayValue('  '), 'Not recorded');
  assert.equal(displayValue(null), 'Not recorded');
  assert.equal(displayValue(0), '0');
  assert.deepEqual(
    sourceLinks('https://user:secret@example.com/a|https://example.com/report'),
    ['https://example.com/report'],
  );
});
