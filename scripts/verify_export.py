"""Fail deployment if the framework silently omits a static route or data."""
import json, sqlite3
from pathlib import Path
from data import read_records
from source_policy import publication_records
root=Path(__file__).resolve().parents[1]; out=root/'dist/client'
for route in ['robots.txt','sitemap.xml','index.html','faq/index.html','mcp/index.html','llms.txt','data-guide.md','faq/index.md','mcp/index.md','data/incidents.json','data/colorado-sar.db']:
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

from html.parser import HTMLParser
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
class PageMetadata(HTMLParser):
    def __init__(self):
        super().__init__(); self.meta={}; self.canonical=None
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='meta': self.meta[a.get('property') or a.get('name')]=a.get('content')
        if tag=='link' and a.get('rel')=='canonical': self.canonical=a.get('href')
urls=[]
for route in ['index.html','faq/index.html','mcp/index.html']:
    page=PageMetadata(); page.feed((out/route).read_text())
    assert page.meta.get('og:url')==page.canonical, f'Incorrect sharing URL: {route}'
    assert page.meta.get('og:title') and page.meta.get('og:description'), f'Missing sharing metadata: {route}'
    assert page.meta.get('twitter:card')=='summary_large_image', f'Missing social card: {route}'
    assert (out/urlsplit(page.meta['og:image']).path.lstrip('/')).is_file(), 'Missing preview image'
    urls.append(page.canonical)
sitemap=ET.parse(out/'sitemap.xml')
assert [n.text for n in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]==urls
assert f"Sitemap: {urls[0].rstrip('/')}/sitemap.xml" in (out/'robots.txt').read_text()
print('Sharing metadata, preview image, robots.txt and sitemap verified')
