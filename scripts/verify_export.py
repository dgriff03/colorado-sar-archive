"""Fail deployment if the framework silently omits a static route or data."""
import json, sqlite3
from pathlib import Path
from data import read_records
from source_policy import publication_records
root=Path(__file__).resolve().parents[1]; out=root/'dist/client'
for route in ['index.html','faq/index.html','mcp/index.html','llms.txt','data-guide.md','faq/index.md','mcp/index.md','data/incidents.json','data/colorado-sar.db']:
    assert (out/route).is_file(),f'Missing export: {route}'
records=json.loads((out/'data/incidents.json').read_text())
accepted,_=read_records(root)
expected,expected_merges=publication_records(root,accepted)
assert len(records)==len(expected), 'Published row count differs from source policy'
assert {r['id'] for r in records}=={r['id'] for r in expected}, 'Published IDs differ from source policy'
expected_details={r['id']+'.json' for r in expected} | {old+'.json' for old in expected_merges}
assert {p.name for p in (out/'data/incidents').glob('*.json')}==expected_details, 'Stale or excluded detail files in export'
db=sqlite3.connect(out/'data/colorado-sar.db')
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert {r[0] for r in db.execute('SELECT id FROM incidents')}=={r['id'] for r in expected}, 'SQLite IDs differ from source policy'
assert all((out/'data/incidents'/(r['id']+'.json')).is_file() for r in records)
aliases=db.execute('SELECT id, canonical_id FROM incident_aliases').fetchall()
assert dict(aliases)=={old:entry['into'] for old,entry in expected_merges.items()}, 'SQLite aliases differ from source policy'
for old, target in aliases:
    assert json.loads((out/'data/incidents'/(old+'.json')).read_text())['id']==target, f'Broken merged incident link: {old}'
manifest=json.loads((root/'dist/server/vinext-prerender.json').read_text())
assert all(r['status']=='rendered' for r in manifest['routes']),manifest['routes']
print(f'Export verified: 3 routes, {len(records)} incident details and matching SQLite')
