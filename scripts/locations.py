"""Reviewed, county-scoped browsing areas; never overwrite reported locations."""
import json
from pathlib import Path

GROUPS = json.loads((Path(__file__).resolve().parents[1] / 'config/location-groups.json').read_text())
LOOKUP = {}
for group in GROUPS:
    for county in group['counties']:
        for alias in group['aliases']:
            key = (county.casefold(), alias.casefold())
            if key in LOOKUP:
                raise ValueError(f'Duplicate location alias: {key}')
            LOOKUP[key] = group['name']


def location_group(record):
    location = record.get('location')
    key = ((record.get('county') or '').strip().casefold(), (location or '').strip().casefold())
    return LOOKUP.get(key, location)
