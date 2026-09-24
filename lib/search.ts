import Fuse from 'fuse.js';
import type { Incident } from './types';
export const MAX_QUERY_LENGTH = 120;
export type Filters = {
  q: string;
  location: string;
  year: string;
  type: string;
  sort: string;
  outcome: string;
  agency: string;
  from: string;
  to: string;
  month: string;
  setting: string;
  placeType: string;
};
export const defaults: Filters = {
  q: '',
  location: '',
  year: 'all',
  type: 'all',
  sort: 'newest',
  outcome: 'all',
  agency: '',
  from: '',
  to: '',
  month: 'all',
  setting: 'all',
  placeType: 'all',
};
export const normalizePlace = (s: string) =>
  s
    .toLocaleLowerCase()
    .replace(/\bmt\.?\s+/g, 'mount ')
    .replace(/\bsaint\b/g, 'st')
    .replace(/[.’']/g, '')
    .replace(/\bberistdat\b/g, 'bierstadt')
    .replace(/\s+/g, ' ')
    .trim();
export function displayValue(value: unknown) {
  return value == null || (typeof value === 'string' && !value.trim())
    ? 'Not recorded'
    : String(value);
}
export function createSearch(records: Incident[]) {
  const fuse = new Fuse(records, {
    keys: [
      { name: 'summary', weight: 0.75 },
      { name: 'notes', weight: 0.25 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return (filters: Filters) => {
    const query = filters.q.trim().slice(0, MAX_QUERY_LENGTH);
    const location = normalizePlace(filters.location.slice(0, 300));
    const agency = filters.agency.trim().toLocaleLowerCase();
    const types = filters.type === 'all' ? [] : filters.type.split(',');
    const matchesFilters = (r: Incident) =>
      (!location ||
        [r.location, r.location_group, r.county, r.place, r.peak].some(
          (s) => s && normalizePlace(s).includes(location),
        )) &&
      (!agency || r.responding_agency?.toLocaleLowerCase().includes(agency)) &&
      (filters.year === 'all' || r.date.startsWith(filters.year)) &&
      (!types.length || types.includes(r.incident_type || '')) &&
      (filters.outcome === 'all' ||
        (filters.outcome === '__missing__'
          ? !r.outcome?.trim()
          : r.outcome?.trim().toLocaleLowerCase() ===
            filters.outcome.toLocaleLowerCase())) &&
      (!filters.from || r.date >= filters.from) &&
      (!filters.to || r.date <= filters.to) &&
      (filters.month === 'all' || r.date.slice(5, 7) === filters.month) &&
      (filters.setting === 'all' || r.setting === filters.setting) &&
      (filters.placeType === 'all' || r.place_type === filters.placeType);
    // Bound each fuzzy pattern to one Bitap word. Long queries use literal
    // all-token matching rather than multiplying fuzzy work for long strings.
    let result: Incident[];
    if (query.length > 32) {
      const tokens = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
      result = records.filter(
        (r) =>
          matchesFilters(r) &&
          tokens.every((t) =>
            `${r.summary} ${r.notes || ''}`.toLocaleLowerCase().includes(t),
          ),
      );
    } else {
      result = (
        query ? fuse.search(query).map((r) => r.item) : [...records]
      ).filter(matchesFilters);
    }
    if (filters.sort !== 'relevance' || !query)
      result.sort(
        (a, b) =>
          (filters.sort === 'oldest'
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id),
      );
    return result;
  };
}
export const label = (s?: string | null) =>
  s?.trim()
    ? s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Not recorded';
export const formatDate = (s: string) =>
  new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
export function sourceLinks(value?: string | null) {
  return (value || '')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => {
      try {
        const u = new URL(s);
        return (
          ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password
        );
      } catch {
        return false;
      }
    });
}
