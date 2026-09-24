"""Validate, promote and build incident data using only Python's standard library."""
import argparse, datetime, json, math, os, re, sqlite3, tempfile, uuid
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from duplicates import ensure_no_identical_submissions, find_candidates, markdown_report
ROOT = Path(__file__).resolve().parents[1]
TEXT_FIELDS = ['date','summary','location','county','incident_type','outcome','responding_agency','source_urls','notes','peak','setting','place','place_type']
NUMBER_FIELDS = []
FIELDS = ['id','legacy_id'] + TEXT_FIELDS + ['victims','detail_score'] + NUMBER_FIELDS

def validate(record, path, pending=False):
    if not isinstance(record, dict): raise ValueError(f'{path}: expected JSON object')
    if set(record) - set(FIELDS): raise ValueError(f'{path}: unknown fields {set(record)-set(FIELDS)}')
    ident = record.get('id','')
    if not isinstance(ident,str) or not re.fullmatch(r'(legacy-\d{6}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})',ident): raise ValueError(f'{path}: use a UUID v4 ID')
    if path.stem != ident: raise ValueError(f'{path}: filename must equal id.json')
    if pending and (ident.startswith('legacy-') or 'legacy_id' in record): raise ValueError(f'{path}: legacy IDs reserved for initial import')
    date = record.get('date','')
    if not isinstance(date,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',date): raise ValueError(f'{path}: ISO date required')
    datetime.date.fromisoformat(date)
    for key in (['summary','location','source_urls'] if pending or not ident.startswith('legacy-') else ['summary']):
        if not isinstance(record.get(key),str) or not record[key].strip(): raise ValueError(f'{path}: {key} required')
    for key in TEXT_FIELDS:
        if record.get(key) is not None and not isinstance(record[key],str): raise ValueError(f'{path}: {key} must be text or null')
    for key in NUMBER_FIELDS + ['victims','legacy_id']:
        value=record.get(key)
        if value is not None and (isinstance(value,bool) or not isinstance(value,(float,int)) or not math.isfinite(value)): raise ValueError(f'{path}: invalid {key}')
    for key in ['victims','legacy_id']:
        value=record.get(key)
        if value is not None and (not isinstance(value,int) or value<0): raise ValueError(f'{path}: {key} must be a nonnegative integer')
    if record.get('detail_score') is not None and (isinstance(record['detail_score'],bool) or not isinstance(record['detail_score'],(str,int,float)) or (isinstance(record['detail_score'],float) and not math.isfinite(record['detail_score']))): raise ValueError(f'{path}: invalid detail_score')
    if pending:
        from urllib.parse import urlparse
        for url in record['source_urls'].split('|'):
            parsed=urlparse(url.strip())
            if parsed.scheme not in ('https','http') or not parsed.netloc: raise ValueError(f'{path}: source must be an HTTP(S) URL')
    return record

def read_records(root, include_pending=True, check_identical=True):
    accepted=[]; submissions=[]; seen=set()
    groups=[(root/'data/incidents',accepted,False)]
    if include_pending: groups.append((root/'pending',submissions,True))
    for directory,items,is_pending in groups:
        for path in sorted(directory.rglob('*.json')):
            if path.is_symlink(): raise ValueError(f'{path}: symlinks not allowed')
            record=validate(json.loads(path.read_text()),path,is_pending)
            if not is_pending and path.parent.name != record['date'][:4]: raise ValueError(f'{path}: wrong year directory')
            if record['id'] in seen: raise ValueError(f'{path}: duplicate ID')
            seen.add(record['id']); items.append((path,record))
    if check_identical:
        ensure_no_identical_submissions(accepted, submissions)
    return accepted,submissions

def promote(root):
    accepted,pending=read_records(root)
    # Preflight the entire batch before moving a single file. Rename is atomic;
    # a interrupted run can be safely rerun because each file exists in one place.
    for source,record in pending:
        target=root/'data/incidents'/record['date'][:4]/source.name
        if target.exists(): raise ValueError(f'Already exists: {target}')
    for source,record in pending:
        target=root/'data/incidents'/record['date'][:4]/source.name
        target.parent.mkdir(parents=True,exist_ok=True)
        source.rename(target)
    print(f'Promoted {len(pending)} incidents')

def build(root):
    accepted,_=read_records(root)
    records=sorted((r for _,r in accepted),key=lambda r:(r['date'],r['id']),reverse=True)
    out=root/'public/data'; out.mkdir(parents=True,exist_ok=True)
    details=out/'incidents'; details.mkdir(exist_ok=True)
    keep={r['id']+'.json' for r in records}
    for old in details.glob('*.json'):
        if old.name not in keep: old.unlink()
    index=[]
    index_fields=['id','date','summary','location','county','incident_type','outcome','responding_agency','place','peak']
    for record in records:
        (details/(record['id']+'.json')).write_text(json.dumps(record,ensure_ascii=False,separators=(',',':'))+'\n')
        index.append({k:record.get(k) for k in index_fields})
    (out/'incidents.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
    fd,tmp=tempfile.mkstemp(suffix='.db',dir=out); os.close(fd)
    try:
        db=sqlite3.connect(tmp)
        cols=['id TEXT PRIMARY KEY','legacy_id INTEGER']+[f'{k} TEXT' for k in TEXT_FIELDS]+['victims INTEGER','detail_score']+[f'{k} REAL' for k in NUMBER_FIELDS]
        db.execute('CREATE TABLE incidents ('+','.join(cols)+')')
        db.executemany('INSERT INTO incidents VALUES ('+','.join('?' for _ in FIELDS)+')',[[r.get(k) for k in FIELDS] for r in records])
        db.execute('CREATE INDEX idx_incidents_date ON incidents(date)'); db.execute('CREATE INDEX idx_incidents_county ON incidents(county)')
        db.commit(); db.close(); os.replace(tmp,out/'colorado-sar.db')
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
    print(f'Built index, details and SQLite for {len(records)} incidents')

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('command',choices=['validate','promote','build','new','duplicates']); parser.add_argument('--all', action='store_true'); parser.add_argument('--output', type=Path); args=parser.parse_args()
    try:
        if args.command=='validate':
            a,p=read_records(ROOT); print(f'Valid: {len(a)} accepted, {len(p)} pending')
        elif args.command=='promote': promote(ROOT)
        elif args.command=='build': build(ROOT)
        elif args.command=='duplicates':
            a,p=read_records(ROOT, check_identical=False)
            matches=find_candidates(a,p,all_records=args.all)
            report=markdown_report(matches,ROOT,args.all)
            if args.output:
                args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(report)
                print(f'{len(matches)} candidate pairs; report: {args.output}')
            else: print(report)
            if any(m['blocking'] for m in matches): raise SystemExit('Identical pending submissions found; see duplicate report')
        else:
            ident=str(uuid.uuid4()); target=ROOT/'pending'/(ident+'.json')
            target.write_text(json.dumps(dict(id=ident,date='',summary='',location='',county='',incident_type='',outcome=None,victims=None,responding_agency='',source_urls='',notes=''),indent=2)+'\n'); print(target)
    except (ValueError,TypeError) as exc: raise SystemExit(str(exc))
