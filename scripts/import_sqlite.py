"""One-time incident import (weather fields intentionally excluded). Original file is never modified."""
import json, sqlite3, sys
from pathlib import Path
source = Path(sys.argv[1]).resolve()
dest = Path(__file__).resolve().parents[1] / 'data/incidents'
# Uploaded snapshot has WAL mode in its header, but no sidecars. Immutable opens
# this standalone snapshot without creating a journal beside the user's file.
con = sqlite3.connect(source.as_uri() + '?immutable=1', uri=True)
con.row_factory = sqlite3.Row
assert con.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
for row in con.execute('SELECT * FROM incidents ORDER BY id'):
    record = {k: row[k] for k in row.keys() if not k.startswith('wx_')}
    record['legacy_id'] = record['id']
    record['id'] = f"legacy-{record['id']:06d}"
    target = dest / record['date'][:4] / (record['id'] + '.json')
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists(): raise SystemExit(f'Refusing to overwrite {target}')
    target.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {con.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]} incidents')
