# Curating location groups

Reports use inconsistent names and levels of detail. `location` stays exactly as
reported in the accepted JSON. The build adds `location_group` to the search
index, full details and SQLite database. Website and MCP grouping by `location`
use this derived field. Incident details show both values. Search checks both.
These are browsing areas, not verified coordinates or claims that every feature
within an area is the same place.

## Initial reviewed areas

| Browsing area | Records | Distinct reported labels |
| --- | ---: | ---: |
| St. Mary's Glacier / Lake area | 109 | 17 |
| Mount Bierstadt | 187 | 19 |
| Summit Lake (Mount Blue Sky) | 27 | 11 |
| Torreys Peak (including Kelso Ridge) | 60 | 20 |

The broader pass adds 54 more groups, including Longs Peak routes, Mount Blue
Sky/Evans, Quandary ridges, Eldorado Canyon climbs, Flatiron spellings and local
park/trail/lake aliases. See the [complete review and counts](location-review.md).
Regenerate that report with `python3 scripts/location-report.py > docs/location-review.md`.

Counts above reflect the initial mappings; the linked report covers all current groups.
The supporting evidence is the accepted records' location, county, summary and
source notes. No incident text, IDs, outcomes or source URLs were overwritten.

The St. Mary's group includes lake, glacier, trail, trailhead and immediate-area
reports in Clear Creek County. Nearby roads, Cumberland Gulch, and Alice stay
separate. Bierstadt includes mountain, summit, slopes, trail and trailhead labels;
Sawtooth and multi-mountain reports stay separate. Bierstadt Lake in Rocky
Mountain National Park is excluded. Summit Lake is scoped to Clear Creek County;
Camp Rock and the Summit Lake-to-Dumont Lake report in Routt County are excluded.
Historical Mount Evans wording remains in the original records.
Torreys Peak includes Kelso Ridge, summit, faces and named couloirs. Shared
Grays/Torreys and Grizzly areas stay separate. Both `Clear Creek` and the legacy
`Clear Creek County` spelling are matched; reported route names are preserved.

## Add or correct a mapping

Edit `config/location-groups.json` in a PR. Each group has a display name, explicit
counties, explicit aliases, and a rationale. Match is case-insensitive with outer
whitespace ignored, otherwise exact; unlisted names or counties fall back to the
reported location. A blank county may be explicitly allowed for an unmistakably named feature
(such as a record explicitly naming Longs Peak); it does not fill in the county.
Legacy `County` suffixes must be listed explicitly. Read the affected summaries
and source notes before adding
an alias. Do not infer equivalence from fuzzy name similarity alone. Explain the
evidence and exclusions in the PR, and extend `tests/test_locations.py` for
ambiguous names. Do not add `location_group` to canonical or pending records;
it is generated so future mapping corrections apply consistently.

Run `npm run data:build`, `npm test`, `npm run typecheck` and `npm run build`.
Rebuild/deploy the hosted MCP alongside the site to publish matching groupings.
SQL consumers can use:

```sql
SELECT location_group, COUNT(*) AS records
FROM incidents
GROUP BY location_group
ORDER BY records DESC;
```

## Place hierarchy

`config/places.json` layers a reviewed hierarchy over the groups above, so a
search for an area finds the named features inside it. Each place has an ID, a
name, aliases, optional counties and relationships:

- `parents`: places it is within. Searching "Maroon Bells" includes Maroon Peak,
  North Maroon Peak, the Bells Traverse, Bell Cord, Maroon Valley, Maroon Lake and
  the Maroon Bells Crater Lake.
- `admin`: the wilderness or park it lies in. Searching the wilderness includes
  everything inside it; searching the area does not include the whole wilderness.
- `nearby`: shown as a separate "Nearby" list, not counted as a match (Pyramid
  Peak and East Maroon Trail near the Bells; Capitol Creek near Capitol Peak).
- `search_scope`: searching this place searches a larger area instead (Longs Peak
  searches the Longs Peak area, including Chasm Lake, Mount Meeker and Mount Lady
  Washington).
- `location_group`: links a reviewed browsing area, so its exact aliases tag records.
- `scoped_aliases`: short route names (K2, Knife Edge, Keyhole, Narrows, Diamond,
  East Ridge, Red Gully, Traverse) that only count when a required place is also
  named, so "Mt. Sneffels, the keyhole" is not tagged as Longs Peak.

The build adds `location_places` (most specific IDs; ancestors are implied) to the
index, details and SQLite (a JSON array, with a `places` table). Tags come from
`location` and `place` only: names are normalized (case, Mt/Mount, St/Saint,
apostrophes, punctuation, Mount Blue Sky = Mount Evans), matched as whole phrases,
longest first, and must fit the record's county. The `peak` field is not used
because it often names a nearby feature rather than the incident location.
`stop_phrases` block misleading matches such as "Maroon Creek Bridge" on Highway 82.
Validation rejects unknown references and cycles. Keep `normalize()` in
`scripts/places.py` and `normalizePlaceName()` in `lib/places.ts` in sync.

## Potential duplicate reports

Location consolidation does not merge incidents or imply that counts are unique
rescues. `344f53fc-73b7-4ca3-8985-46dfa8997f6d` and `43388c0a-1a01-4d61-abfd-d82b17856aa2` are a known possible St. Mary's
pair: the first record's notes explicitly say the same-event relationship is
unconfirmed. Both remain intact pending source verification. Multi-day or
multi-party reports need event-level review before any deletion or merge.
