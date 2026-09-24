import json, sqlite3, tempfile, unittest, uuid
from pathlib import Path
from test_data import data
from source_policy import fingerprint, normalize_domain, normalize_url, read_policy, source_match, publication_records

class SourcePolicyTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        (self.root/'config').mkdir();(self.root/'pending').mkdir()
        (self.root/'config/disallowed-domains.json').write_text('["14ers.com"]')
    def tearDown(self):self.tmp.cleanup()
    def exclude(self, **entries):
        (self.root/'config/exclusions.json').write_text(json.dumps(entries))
    def record(self, ident='legacy-000001', source='https://allowed.example/report'):
        return dict(id=ident,date='2020-01-01',summary='Test rescue',location='Test peak',source_urls=source)
    def accepted(self, record):
        d=self.root/'data/incidents/2020';d.mkdir(parents=True,exist_ok=True)
        p=d/(record['id']+'.json');p.write_text(json.dumps(record));return p

    def test_domain_boundary_case_subdomains_and_url_spoofing(self):
        policy=read_policy(self.root)
        for url in ['https://14ers.com/a', 'http://WWW.14ERS.COM./a', 'https://forum.14ers.com:443/a', 'https://%31%34ers.com/a']:
            self.assertEqual(source_match(url,policy),'disallowed source domain')
        for url in ['https://not14ers.com/a', 'https://14ers.com.allowed.example/a', 'https://allowed.example/?next=https://14ers.com']:
            self.assertIsNone(source_match(url,policy))
        for url in ['https://14ers.com@allowed.example/a','https://allowed.example@14ers.com/a','javascript:alert(1)']:
            with self.assertRaises(ValueError):source_match(url,policy)

    def test_normalized_hashes(self):
        self.assertEqual(normalize_domain('WWW.Example.ORG.'),'example.org')
        self.assertEqual(normalize_domain('BÜCHER.example'),'xn--bcher-kva.example')
        self.assertEqual(normalize_url('http://WWW.Example.org:80/a?q=1#frag'),'https://example.org/a?q=1')
        self.assertNotEqual(fingerprint(normalize_url('https://example.org/a?q=1')),fingerprint(normalize_url('https://example.org/a?q=2')))
        self.exclude(domain_md5=[fingerprint('example.org')])
        self.assertEqual(source_match('https://sub.example.org/a',read_policy(self.root)),'excluded source domain')

    def test_pending_validation_and_promotion_block_all_source_types(self):
        ident=str(uuid.uuid4()); path=self.root/'pending'/(ident+'.json')
        for entries, source in [({},'https://14ers.com/a'),
            ({'domain_md5':[fingerprint('example.org')]},'https://sub.example.org/a'),
            ({'url_md5':[fingerprint(normalize_url('https://example.org/a'))]},'http://www.example.org/a#frag'),
            ({'incident_ids':[ident]},'https://allowed.example/a')]:
            self.exclude(**entries)
            path.write_text(json.dumps(self.record(ident,source)))
            with self.assertRaisesRegex(ValueError,'source policy'):data.read_records(self.root)
            with self.assertRaises(ValueError):data.promote(self.root)
            self.assertTrue(path.exists())

    def test_rebuild_removes_mixed_source_record_and_merged_alias_everywhere(self):
        survivor=self.record(source='https://allowed.example/report|https://removed.example/report')
        retired=self.record('legacy-000002')
        paths=[self.accepted(r) for r in [survivor,retired]]
        (self.root/'config/incident-merges.json').write_text(json.dumps({retired['id']:dict(into=survivor['id'],reason='same event')}))
        data.build(self.root)
        self.assertTrue((self.root/'public/data/incidents/legacy-000002.json').exists())
        self.exclude(domain_md5=[fingerprint('removed.example')])
        data.build(self.root)
        self.assertEqual(json.loads((self.root/'public/data/incidents.json').read_text()),[])
        self.assertEqual(list((self.root/'public/data/incidents').glob('*.json')),[])
        with sqlite3.connect(self.root/'public/data/colorado-sar.db') as db:
            self.assertEqual(db.execute('select count(*) from incidents').fetchone()[0],0)
            self.assertEqual(db.execute('select count(*) from incident_aliases').fetchone()[0],0)
        self.assertTrue(all(p.exists() for p in paths))
        self.exclude(incident_ids=[retired['id']])
        self.assertEqual(publication_records(self.root,[(p,json.loads(p.read_text())) for p in paths]),([],{}))

    def test_disallowed_accepted_source_is_withheld_even_with_allowed_sources(self):
        self.accepted(self.record(source='https://14ers.com/a|https://allowed.example/report'))
        accepted,_=data.read_records(self.root)
        self.assertEqual(publication_records(self.root,accepted),([],{}))
        data.build(self.root)
        self.assertEqual(json.loads((self.root/'public/data/incidents.json').read_text()),[])

    def test_invalid_policy_fails_closed_and_exclusion_can_outlive_deleted_file(self):
        for entries in [{'domain_md5':['oops']},{'url_md5':['A'*32]},{'incident_ids':['../../bad']},{'typo':[]}]:
            self.exclude(**entries)
            with self.assertRaises(ValueError):data.read_records(self.root)
        self.exclude(incident_ids=['legacy-000001'])
        self.assertEqual(data.read_records(self.root),([],[]))
