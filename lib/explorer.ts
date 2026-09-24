import { defaults, type Filters } from './search.ts';
import type { Incident } from './types';
export const dimensions = [
  'location',
  'outcome',
  'county',
  'incident_type',
  'responding_agency',
  'setting',
  'place_type',
] as const;
export type Dimension = (typeof dimensions)[number];
export const dimensionLabels: Record<Dimension, string> = {
  location: 'Location (normalized area)',
  outcome: 'Outcome',
  county: 'County',
  incident_type: 'Incident type',
  responding_agency: 'Responding agency',
  setting: 'Setting',
  place_type: 'Place type',
};
export type GroupFilter = { field: Dimension; value: string | null };
export type IncidentGroup = {
  key: string;
  values: GroupFilter[];
  labels: string[];
  count: number;
};
export type ExplorerState = {
  filters: Filters;
  view: 'incidents' | 'groups';
  by: Dimension;
  then: Dimension | 'none';
  drill: GroupFilter[];
  page: number;
  selected: string | null;
};
export const initialExplorer: ExplorerState = {
  filters: defaults,
  view: 'incidents',
  by: 'location',
  then: 'none',
  drill: [],
  page: 1,
  selected: null,
};
export const groupValue = (value: string | null | undefined) =>
  value?.trim().toLocaleLowerCase() || null;
const dimensionValue = (record: Incident, field: Dimension) =>
  field === 'location' ? record.location_group ?? record.location : record[field];
export function aggregateIncidents(
  records: Incident[],
  fields: Dimension[],
): IncidentGroup[] {
  const groups = new Map<string, IncidentGroup>();
  for (const record of records) {
    const values = fields.map((field) => ({
      field,
      value: groupValue(dimensionValue(record, field)),
    }));
    const key = JSON.stringify(values);
    const group = groups.get(key);
    if (group) group.count++;
    else
      groups.set(key, {
        key,
        values,
        labels: fields.map((f) => dimensionValue(record, f)?.trim() || 'Not recorded'),
        count: 1,
      });
  }
  return [...groups.values()].sort(
    (a, b) => b.count - a.count || a.key.localeCompare(b.key),
  );
}
export function inGroup(record: Incident, filters: GroupFilter[]) {
  return filters.every(
    ({ field, value }) =>
      groupValue(dimensionValue(record, field)) === value ||
      // Preserve older shared drill-down links using the reported location.
      (field === 'location' && groupValue(record.location) === value),
  );
}
export function readExplorer(search: string): ExplorerState {
  const p = new URLSearchParams(search),
    filters = { ...defaults };
  for (const key of [
    'q',
    'location',
    'year',
    'type',
    'outcome',
    'agency',
    'from',
    'to',
    'month',
    'setting',
    'placeType',
  ] as const)
    if (p.has(key))
      filters[key] = p.get(key)!.slice(0, key === 'q' ? 120 : 300);
  if (['newest', 'oldest', 'relevance'].includes(p.get('sort') || ''))
    filters.sort = p.get('sort')!;
  const by = dimensions.includes(p.get('by') as Dimension)
    ? (p.get('by') as Dimension)
    : 'location';
  const then =
    dimensions.includes(p.get('then') as Dimension) && p.get('then') !== by
      ? (p.get('then') as Dimension)
      : 'none';
  let drill: GroupFilter[] = [];
  try {
    const value = JSON.parse(p.get('group') || '[]');
    if (
      Array.isArray(value) &&
      value.length <= 2 &&
      value.every(
        (v) =>
          v &&
          dimensions.includes(v.field) &&
          (v.value === null || typeof v.value === 'string'),
      )
    )
      drill = value.map(({ field, value }) => ({
        field,
        value: groupValue(value),
      }));
  } catch {
    /* Invalid group links fall back to the full archive. */
  }
  const id = p.get('incident');
  const page = Number(p.get('page'));
  return {
    filters,
    view: p.get('view') === 'groups' ? 'groups' : 'incidents',
    by,
    then,
    drill,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    selected:
      id &&
      /^(legacy-\d{6}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/.test(
        id,
      )
        ? id
        : null,
  };
}
export function explorerUrl(state: ExplorerState) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state.filters))
    if (v !== defaults[k as keyof Filters]) p.set(k, v);
  if (state.view === 'groups') p.set('view', 'groups');
  if (state.by !== 'location') p.set('by', state.by);
  if (state.then !== 'none') p.set('then', state.then);
  if (state.drill.length) p.set('group', JSON.stringify(state.drill));
  if (state.page > 1) p.set('page', String(state.page));
  if (state.selected) p.set('incident', state.selected);
  return '/' + (p.size ? '?' + p.toString() : '');
}
