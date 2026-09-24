import Fuse from 'fuse.js';
import type { Incident } from './types';
export type Filters = {
  q: string;
  location: string;
  year: string;
  type: string;
  sort: string;
};
export const defaults: Filters = {
  q: '',
  location: '',
  year: 'all',
  type: 'all',
  sort: 'newest',
};
export function createSearch(records: Incident[]) {
  const fuse = new Fuse(records, {
    keys: ['summary'],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return (filters: Filters) => {
    let result = filters.q.trim()
      ? fuse.search(filters.q.trim()).map((r) => r.item)
      : [...records];
    const location = filters.location.trim().toLocaleLowerCase();
    result = result.filter(
      (r) =>
        (!location ||
          [r.location, r.county, r.place, r.peak].some((s) =>
            s?.toLocaleLowerCase().includes(location),
          )) &&
        (filters.year === 'all' || r.date.startsWith(filters.year)) &&
        (filters.type === 'all' || r.incident_type === filters.type),
    );
    if (filters.sort !== 'relevance' || !filters.q.trim())
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
  s
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
        return ['http:', 'https:'].includes(u.protocol);
      } catch {
        return false;
      }
    });
}
