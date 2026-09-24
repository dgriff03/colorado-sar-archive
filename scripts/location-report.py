"""Summarize reviewed location mappings without changing accepted incidents."""
import json
from pathlib import Path
from locations import GROUPS, location_group

root = Path(__file__).resolve().parents[1]
records = [json.loads(p.read_text()) for p in sorted((root/'data/incidents').glob('*/*.json'))]
norm = lambda value: (value or '').strip().casefold()
before = {norm(r.get('location')) for r in records}
after = {norm(location_group(r)) for r in records}
changed = sum(location_group(r) != r.get('location') for r in records)
print('# Location consolidation report\n')
print('Generated with `python3 scripts/location-report.py`. Counts describe archive records, not distinct rescues.\n')
print(f'{len(records):,} incidents retained; {changed:,} receive a different browsing label. '
      f'Distinct location groups decrease from {len(before):,} reported labels to {len(after):,} browsing labels '
      '(case and outer whitespace normalized).\n')
print('Mappings are exact and county-scoped. Original locations, source notes and IDs remain unchanged. '
      'An area can include routes, summit, slopes or lake approaches. This is not geocoding.\n')
print('| Reviewed browsing area | Records | Reported labels |\n| --- | ---: | ---: |')
for group in GROUPS:
    matched = [r for r in records if location_group(r) == group['name']]
    print(f"| {group['name']} | {len(matched)} | {len({r.get('location') for r in matched})} |")
print('\n## Decisions and exclusions\n')
for group in GROUPS:
    counties = ', '.join(c or 'not recorded' for c in group['counties'])
    print(f"- **{group['name']}** ({counties}): {group['rationale']}")
print('\n## Remaining work\n')
print('Unlisted names remain as reported. Generic county-wide locations, unclear nearby-area reports, '
      'and multi-mountain traverses need more evidence before assignment to a single mountain. '
      'No incident duplicates were merged or deleted. See [location curation](locations.md) for the review process.')
