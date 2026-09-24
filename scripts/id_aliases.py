"""Compatibility IDs from the one-time UUID migration; never used as primary IDs."""
import json
import re

UUID = r'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'


def id_aliases(root):
    path = root/'config/id-aliases.json'
    aliases = json.loads(path.read_text()) if path.exists() else {}
    if not isinstance(aliases, dict):
        raise ValueError('ID aliases must be an object')
    for old, target in aliases.items():
        if not re.fullmatch(r'legacy-\d{6}', old) or not isinstance(target,str) or not re.fullmatch(UUID,target):
            raise ValueError('ID aliases must map legacy import IDs directly to UUID v4 IDs')
    if len(set(aliases.values())) != len(aliases):
        raise ValueError('Import ID aliases must have unique UUID targets')
    return aliases
