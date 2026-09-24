"""Explicit maintainer-reviewed incident merges; preserve original files and IDs."""
import json


def incident_merges(root, records):
    path = root / 'config/incident-merges.json'
    merges = json.loads(path.read_text()) if path.exists() else {}
    if not isinstance(merges, dict):
        raise ValueError('Incident merges must be an object')
    ids = {r['id'] for r in records}
    for old, entry in merges.items():
        if not isinstance(entry, dict) or not isinstance(entry.get('into'), str) or not isinstance(entry.get('reason'), str) or not entry['reason'].strip():
            raise ValueError(f'Invalid incident merge: {old}')
        if old not in ids or entry['into'] not in ids:
            raise ValueError(f'Incident merge references missing record: {old}')
        if entry['into'] in merges:
            raise ValueError(f'Incident merges must point directly to an active record (no self-reference, chains or cycles): {old}')
    return merges
