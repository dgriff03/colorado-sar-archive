import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSearch, defaults } from '../lib/search.ts';
import type { Incident } from '../lib/types.ts';

test('location search supports normalized groups, punctuation and Bierstadt typo', () => {
  const records = [
    { id: 'a', date: '2020-01-01', summary: 'Rescue', location: 'Mt Bierstadt (summit)', location_group: 'Mount Bierstadt' },
    { id: 'b', date: '2020-01-01', summary: 'Rescue', location: 'St Marys Lake', location_group: "St. Mary's Glacier / Lake area" },
  ] as Incident[];
  const search = createSearch(records);
  assert.deepEqual(search({ ...defaults, location: 'Mt beristdat' }).map(r => r.id), ['a']);
  assert.deepEqual(search({ ...defaults, location: 'Saint Mary’s Glacier' }).map(r => r.id), ['b']);
  assert.equal(records[1].location, 'St Marys Lake');
});
