import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateIncidents,
  inGroup,
  explorerUrl,
  readExplorer,
  initialExplorer,
  type ExplorerState,
} from '../lib/explorer.ts';
import { createExplorerNavigation } from '../lib/navigation.ts';
import type { Incident } from '../lib/types.ts';
const incidents = [
  { id: 'a', location: 'Longs Peak', outcome: 'rescued', county: 'Larimer' },
  { id: 'b', location: ' longs peak ', outcome: 'rescued', county: 'Larimer' },
  { id: 'c', location: 'Longs Peak', outcome: 'fatal', county: 'Larimer' },
  { id: 'd', location: null, outcome: null, county: 'Boulder' },
  { id: 'e', location: '', outcome: 'rescued', county: 'Boulder' },
  {
    id: 'f',
    location: 'Longs Peak Trail',
    outcome: 'rescued',
    county: 'Larimer',
  },
] as Incident[];
test('one-field groups count all records descending, normalizing case and blanks', () => {
  const groups = aggregateIncidents(incidents, ['location']);
  assert.deepEqual(
    groups.map((g) => g.count),
    [3, 2, 1],
  );
  assert.equal(groups[1].values[0].value, null);
  assert.equal(
    groups.reduce((n, g) => n + g.count, 0),
    incidents.length,
  );
});
test('two-field drilldown exactly matches the selected count, never substring matching', () => {
  for (const g of aggregateIncidents(incidents, ['outcome', 'location']))
    assert.equal(incidents.filter((r) => inGroup(r, g.values)).length, g.count);
  const g = aggregateIncidents(incidents, ['outcome', 'location'])[0];
  assert.equal(g.count, 2);
  assert.deepEqual(
    incidents.filter((r) => inGroup(r, g.values)).map((r) => r.id),
    ['a', 'b'],
  );
});
test('filters are applied before aggregation', () =>
  assert.equal(
    aggregateIncidents(
      incidents.filter((r) => r.county === 'Boulder'),
      ['location'],
    )[0].count,
    2,
  ));
test('URL roundtrip preserves group, filters, page, and incident', () => {
  const state: ExplorerState = {
    ...initialExplorer,
    filters: {
      ...initialExplorer.filters,
      q: 'climber',
      location: 'Longs',
      agency: 'SAR',
      outcome: 'injury',
      type: 'fall,injury',
      from: '2025-01-01',
      to: '2026-01-01',
      month: '01',
      setting: 'wilderness',
      placeType: 'peak',
    },
    by: 'outcome',
    then: 'location',
    drill: [{ field: 'location', value: 'longs peak' }],
    page: 3,
    selected: 'legacy-000001',
  };
  assert.deepEqual(readExplorer(explorerUrl(state).split('?')[1]), state);
});
test('malformed URL state fails safely', () => {
  const s = readExplorer(
    '?by=__proto__&then=location&page=-3&group=%7B&incident=../../x',
  );
  assert.equal(s.by, 'location');
  assert.equal(s.then, 'none');
  assert.equal(s.page, 1);
  assert.equal(s.selected, null);
  assert.deepEqual(s.drill, []);
});
function historyHarness(url = '/') {
  const stack = [{ url, state: {} as Record<string, unknown> }];
  let index = 0;
  let state = initialExplorer;
  let backCalls = 0;
  const controller = createExplorerNavigation(
    {
      url: () => stack[index].url,
      historyState: () => stack[index].state,
      write: (url, mode, overlay) => {
        const item = { url, state: { sarOverlay: overlay } };
        if (mode === 'push') {
          stack.splice(index + 1);
          stack.push(item);
          index++;
        } else stack[index] = item;
      },
      back: () => {
        backCalls++;
        if (index > 0) {
          index--;
          controller.sync();
        }
      },
      notify: () => {},
    },
    (next) => {
      state = next;
    },
  );
  controller.sync();
  return {
    controller,
    get state() {
      return state;
    },
    get url() {
      return stack[index].url;
    },
    get backCalls() {
      return backCalls;
    },
    get length() {
      return stack.length;
    },
    back() {
      if (index > 0) index--;
      controller.sync();
    },
    forward() {
      if (index < stack.length - 1) index++;
      controller.sync();
    },
  };
}
test('incident Back and Forward restore group, filters and pagination', () => {
  const h = historyHarness();
  h.controller.navigate({ view: 'groups', page: 2 });
  const groupUrl = h.url;
  h.controller.navigate({
    view: 'incidents',
    drill: [{ field: 'location', value: 'longs peak' }],
    page: 1,
  });
  const listUrl = h.url;
  h.controller.openIncident('legacy-000001');
  assert.match(h.url, /incident=legacy-000001/);
  h.back();
  assert.equal(h.url, listUrl);
  assert.equal(h.state.selected, null);
  h.forward();
  assert.equal(h.state.selected, 'legacy-000001');
  h.controller.closeIncident();
  assert.equal(h.url, listUrl);
  h.back();
  assert.equal(h.url, groupUrl);
  assert.equal(h.state.page, 2);
});
test('closing a directly shared incident stays on the archive', () => {
  const h = historyHarness('/?incident=legacy-000001');
  h.controller.closeIncident();
  assert.equal(h.backCalls, 0);
  assert.equal(h.url, '/');
  assert.equal(h.state.selected, null);
});
test('replacing search state does not create a history entry', () => {
  const h = historyHarness();
  h.controller.navigate(
    { filters: { ...initialExplorer.filters, q: 'rescue' } },
    'replace',
  );
  assert.equal(h.length, 1);
  h.controller.openIncident('legacy-000001');
  h.back();
  assert.equal(h.state.filters.q, 'rescue');
});

test('reviewed location groups combine aliases and preserve clickable group counts', () => {
  const records = [
    { id: 'a', location: 'Mt Bierstadt', location_group: 'Mount Bierstadt', outcome: 'rescued' },
    { id: 'b', location: 'Mount Bierstadt (summit)', location_group: 'Mount Bierstadt', outcome: 'rescued' },
    { id: 'c', location: 'Bierstadt Lake', location_group: 'Bierstadt Lake', outcome: 'rescued' },
  ] as Incident[];
  const group = aggregateIncidents(records, ['location', 'outcome'])[0];
  assert.deepEqual(records.filter(r => inGroup(r, [{ field: 'location', value: 'mt bierstadt' }])).map(r => r.id), ['a']);
  assert.equal(group.count, 2);
  assert.equal(group.labels[0], 'Mount Bierstadt');
  const state = readExplorer(new URL(explorerUrl({ ...initialExplorer, drill: group.values }), 'https://example.org').search);
  assert.deepEqual(records.filter(r => inGroup(r, state.drill)).map(r => r.id), ['a', 'b']);
});

test('merged incident replaces the URL and preserves modal Back navigation', () => {
  const h = historyHarness('/?location=Lone+Eagle');
  h.controller.openIncident('legacy-003648');
  h.controller.resolveIncident('legacy-000537');
  assert.equal(h.length, 2);
  assert.equal(h.state.selected, 'legacy-000537');
  h.controller.closeIncident();
  assert.equal(h.backCalls, 1);
  assert.equal(h.state.selected, null);
  h.forward();
  assert.equal(h.state.selected, 'legacy-000537');
  const direct = historyHarness('/?incident=legacy-003648');
  direct.controller.resolveIncident('legacy-000537');
  assert.equal(direct.length, 1);
  direct.controller.closeIncident();
  assert.equal(direct.backCalls, 0);
  assert.equal(direct.state.selected, null);
});
