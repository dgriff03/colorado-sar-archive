import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createSearch, defaults } from '../lib/search.ts';
import { normalizePlaceName, resolvePlace } from '../lib/places.ts';
import type { Incident } from '../lib/types.ts';
const r = (id: string, location: string, location_places: string[] = []) =>
  ({
    id,
    date: `2020-01-0${id.length}`,
    summary: 'Rescue',
    location,
    county: 'Pitkin',
    location_places,
  }) as Incident;
const records = [
  r('north', 'North Maroon Peak', ['north-maroon-peak']),
  r('cord', 'Bell Cord couloir', ['bell-cord-couloir']),
  r('lake', 'Maroon Lake, outside Aspen', ['maroon-lake']),
  r('snowmass', 'Snowmass Lake, Maroon Bells-Snowmass Wilderness', [
    'snowmass-lake',
  ]),
  r('pyramid', 'Pyramid Peak', ['pyramid-peak']),
  r('untagged', 'somewhere below the Maroon Bells, unclear'),
  r('meeker', 'Mount Meeker', ['mount-meeker']),
];
const search = createSearch(records);
const ids = (xs: Incident[]) => xs.map((x) => x.id).sort();
test('a reviewed area includes places within it but not its whole wilderness', () => {
  assert.deepEqual(ids(search({ ...defaults, location: 'maroon bells' })), [
    'cord',
    'lake',
    'north',
    'untagged',
  ]);
  assert.deepEqual(
    ids(search.nearby({ ...defaults, location: 'Maroon Bells' })),
    ['pyramid'],
  );
  assert.equal(search.place('maroon bells')?.name, 'Maroon Bells area');
});
test('wilderness search includes everything inside it', () =>
  assert.deepEqual(
    ids(search({ ...defaults, location: 'Maroon Bells-Snowmass Wilderness' })),
    ['cord', 'lake', 'north', 'pyramid', 'snowmass'],
  ));
test('Longs Peak searches the Longs Peak area', () => {
  assert.deepEqual(ids(search({ ...defaults, location: 'Longs Peak' })), [
    'meeker',
  ]);
  assert.ok(resolvePlace('longs pk')?.inside.has('chasm-lake'));
});
test('unreviewed text keeps substring matching and nearby stays empty', () => {
  assert.deepEqual(ids(search({ ...defaults, location: 'maroon' })), [
    'lake',
    'north',
    'snowmass',
    'untagged',
  ]);
  assert.deepEqual(search.nearby({ ...defaults, location: 'maroon' }), []);
});
test('TypeScript and Python place normalization agree', () => {
  const samples = [
    'Mt. Bierstadt',
    'Saint Mary’s Glacier',
    'Maroon-Bells-Snowmass',
    'Mount Blue Sky',
    'Kit Carson Pk',
    'Cañon City',
    '  Longs  PEAK ',
  ];
  const python = execFileSync(
    'python3',
    [
      '-c',
      'import json,sys; sys.path.insert(0,"scripts"); from places import normalize; print(json.dumps([normalize(s) for s in json.load(sys.stdin)]))',
    ],
    { input: JSON.stringify(samples) },
  ).toString();
  assert.deepEqual(samples.map(normalizePlaceName), JSON.parse(python));
});
