import config from '../config/places.json' with { type: 'json' };
export type Place = {
  id: string;
  name: string;
  kind: string;
  parents?: string[];
  admin?: string[];
  nearby?: string[];
  aliases?: string[];
  search_scope?: string;
};
const places = config.places as Place[];
const byId = new Map(places.map((p) => [p.id, p]));
/** Keep in sync with normalize() in scripts/places.py. */
export const normalizePlaceName = (text: string) =>
  text
    .toLocaleLowerCase()
    .replace(/’/g, "'")
    .replace(/ñ/g, 'n')
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bmt\b/g, 'mount')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bpk\b/g, 'peak')
    .replace(/\bberistdat\b/g, 'bierstadt')
    .replace(/\bmount blue sky\b/g, 'mount evans')
    .trim()
    .replace(/\s+/g, ' ');
const aliases = new Map<string, Place[]>();
for (const p of places)
  for (const a of [p.name, ...(p.aliases || [])]) {
    const key = normalizePlaceName(a),
      list = aliases.get(key) || [];
    if (!list.includes(p)) list.push(p);
    aliases.set(key, list);
  }
const children = new Map<string, string[]>();
for (const p of places)
  for (const parent of [...(p.parents || []), ...(p.admin || [])])
    children.set(parent, [...(children.get(parent) || []), p.id]);
function within(ids: string[]) {
  const out = new Set<string>(),
    stack = [...ids];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    stack.push(...(children.get(id) || []));
  }
  return out;
}
export type PlaceScope = {
  place: Place;
  inside: Set<string>;
  nearby: Set<string>;
};
/** Resolve a location query that names a reviewed place to that place, everything
 * inside it, and places reviewed as nearby. Other queries return null. */
export function resolvePlace(query: string): PlaceScope | null {
  const matches = aliases.get(normalizePlaceName(query));
  if (!matches) return null;
  const preferred = matches.filter((p) => p.kind !== 'admin_area');
  const chosen = (preferred.length ? preferred : matches).map(
    (p) => byId.get(p.search_scope || '') || p,
  );
  const inside = within(chosen.map((p) => p.id));
  const nearby = within(
    places
      .filter((p) => p.nearby?.some((id) => inside.has(id)))
      .map((p) => p.id),
  );
  for (const id of inside) nearby.delete(id);
  return { place: chosen[0], inside, nearby };
}
