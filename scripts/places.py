"""Reviewed place hierarchy: tag records with the most specific place ids; never overwrite reported locations."""
import json, re
from pathlib import Path
from locations import location_group

CONFIG = json.loads((Path(__file__).resolve().parents[1] / 'config/places.json').read_text())
PLACES = {p['id']: p for p in CONFIG['places']}
TAG_FIELDS = ('location', 'place')  # `peak` is a nearest-feature hint, not evidence of where it happened


def normalize(text):
    """Keep in sync with normalizePlaceName in lib/places.ts."""
    s = text.lower().replace('’', "'").replace('ñ', 'n')
    s = re.sub(r"['.]", '', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    s = re.sub(r'\bmt\b', 'mount', s)
    s = re.sub(r'\bsaint\b', 'st', s)
    s = re.sub(r'\bpk\b', 'peak', s)
    s = re.sub(r'\bberistdat\b', 'bierstadt', s)
    s = re.sub(r'\bmount blue sky\b', 'mount evans', s)
    return ' '.join(s.split())


def _county_set(value):
    parts = re.split(r'[/,;&]| and ', (value or '').lower())
    return {p.replace(' county', '').strip() for p in parts if p.strip()}


def _validate():
    if len(PLACES) != len(CONFIG['places']): raise ValueError('Duplicate place id')
    groups = [p['location_group'] for p in CONFIG['places'] if p.get('location_group')]
    if len(set(groups)) != len(groups): raise ValueError('Duplicate location_group mapping')
    for place in CONFIG['places']:
        for key in ('parents', 'admin', 'nearby'):
            for ref in place.get(key, []):
                if ref not in PLACES: raise ValueError(f"{place['id']}: unknown {key} reference {ref}")
        for scoped in place.get('scoped_aliases', []):
            for ref in scoped['requires']:
                if ref not in PLACES: raise ValueError(f"{place['id']}: unknown scoped requirement {ref}")
        if place.get('search_scope') and place['search_scope'] not in PLACES:
            raise ValueError(f"{place['id']}: unknown search_scope")
    for pid in PLACES:
        if pid in ancestors(pid): raise ValueError(f'{pid}: place hierarchy has a cycle')


def ancestors(pid, seen=None):
    seen = set() if seen is None else seen
    for ref in PLACES[pid].get('parents', []) + PLACES[pid].get('admin', []):
        if ref not in seen:
            seen.add(ref)
            if ref != pid: ancestors(ref, seen)
    return seen


_validate()
ANCESTORS = {pid: ancestors(pid) for pid in PLACES}
BY_GROUP = {p['location_group']: p['id'] for p in CONFIG['places'] if p.get('location_group')}
ALIASES, SCOPED = {}, {}
for place in CONFIG['places']:
    for alias in [place['name']] + place.get('aliases', []):
        ids = ALIASES.setdefault(normalize(alias), [])
        if place['id'] not in ids: ids.append(place['id'])
    for scoped in place.get('scoped_aliases', []):
        SCOPED.setdefault(normalize(scoped['alias']), []).append((place['id'], scoped['requires']))
for phrase in CONFIG.get('stop_phrases', []):
    ALIASES[normalize(phrase)] = []
KEYS = sorted(set(ALIASES) | set(SCOPED), key=lambda k: (-len(k), k))


def _phrases(text):
    """Whole-phrase matches, longest first, without overlaps."""
    padded = f' {normalize(text)} '
    taken, found = [], []
    for key in KEYS:
        start = 0
        while (at := padded.find(f' {key} ', start)) != -1:
            span = (at + 1, at + 1 + len(key))
            if not any(span[0] < b and a < span[1] for a, b in taken):
                taken.append(span); found.append(key)
            start = at + 1
    return found


def location_places(record):
    """Most specific reviewed place ids for a record (ancestors are implied)."""
    counties = _county_set(record.get('county'))
    fits = lambda pid: not counties or not PLACES[pid].get('counties') or bool(counties & {c.lower() for c in PLACES[pid]['counties']})
    ids, scoped = set(), []
    group = location_group(record)
    if group in BY_GROUP and fits(BY_GROUP[group]): ids.add(BY_GROUP[group])
    for field in TAG_FIELDS:
        for key in _phrases(record.get(field) or ''):
            ids.update(pid for pid in ALIASES.get(key, []) if fits(pid))
            scoped += [(pid, req) for pid, req in SCOPED.get(key, []) if fits(pid)]
    for pid, required in scoped:
        if any(i in required or ANCESTORS[i] & set(required) for i in ids): ids.add(pid)
    return sorted(i for i in ids if not any(i in ANCESTORS[j] for j in ids if j != i))
