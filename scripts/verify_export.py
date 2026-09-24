"""Fail deployment if the framework silently omits a static route or data."""
import json, sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]; out=root/'dist/client'
for route in ['index.html','faq/index.html','data/incidents.json','data/colorado-sar.db']:
    assert (out/route).is_file(),f'Missing export: {route}'
records=json.loads((out/'data/incidents.json').read_text())
assert records,'Empty public archive'
db=sqlite3.connect(out/'data/colorado-sar.db')
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert db.execute('SELECT COUNT(*) FROM incidents').fetchone()[0]==len(records)
assert all((out/'data/incidents'/(r['id']+'.json')).is_file() for r in records)
manifest=json.loads((root/'dist/server/vinext-prerender.json').read_text())
assert all(r['status']=='rendered' for r in manifest['routes']),manifest['routes']
print(f'Export verified: 2 routes, {len(records)} incident details and matching SQLite')
