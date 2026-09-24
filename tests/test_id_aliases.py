import json, sqlite3, tempfile, unittest, uuid
from pathlib import Path
from test_data import data
from id_aliases import id_aliases
from source_policy import publication_records

class ImportIdTests(unittest.TestCase):
    def test_uuid_import_aliases_merge_and_removal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); (root/'config').mkdir(); directory=root/'data/incidents/2020';directory.mkdir(parents=True)
            a,b=str(uuid.uuid4()),str(uuid.uuid4())
            aliases={'legacy-000001':a,'legacy-000002':b}
            (root/'config/id-aliases.json').write_text(json.dumps(aliases))
            # Preserve imported categories and missing fields without relaxing new submissions.
            for i,ident in enumerate([a,b],1):
                (directory/(ident+'.json')).write_text(json.dumps(dict(id=ident,legacy_id=i,date='2020-01-01',summary='Rescue',incident_type='historical category',county='Grand County')))
            (root/'config/incident-merges.json').write_text(json.dumps({b:dict(into=a,reason='same rescue')}))
            data.build(root)
            rows=json.loads((root/'public/data/incidents.json').read_text())
            self.assertEqual([r['id'] for r in rows],[a])
            self.assertEqual(set(rows[0]['merged_ids']),{b,*aliases})
            for old in [b,*aliases]:
                self.assertEqual(json.loads((root/'public/data/incidents'/(old+'.json')).read_text())['id'],a)
            with sqlite3.connect(root/'public/data/colorado-sar.db') as db:
                self.assertEqual(dict(db.execute('select id, canonical_id from incident_aliases')),{old:a for old in [b,*aliases]})
            (root/'config/exclusions.json').write_text(json.dumps(dict(incident_ids=['legacy-000002'])))
            data.build(root)
            (root/'pending').mkdir()
            (root/'pending'/(b+'.json')).write_text(json.dumps(dict(id=b,date='2020-01-01',summary='Rescue',location='Test peak',source_urls='https://example.org/report')))
            with self.assertRaisesRegex(ValueError,'source policy'):data.read_records(root)
            self.assertEqual(list((root/'public/data/incidents').glob('*.json')),[])
            self.assertEqual(json.loads((root/'public/data/incidents.json').read_text()),[])

    def test_registry_validation_and_import_provenance(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'config').mkdir();p=root/'config/id-aliases.json';ident=str(uuid.uuid4())
            for value in [[], {'bad':ident}, {'legacy-000001':'not-uuid'}, {'legacy-000001':ident,'legacy-000002':ident}]:
                p.write_text(json.dumps(value))
                with self.assertRaises(ValueError):id_aliases(root)
            p.write_text(json.dumps({'legacy-000001':ident}))
            directory=root/'data/incidents/2020';directory.mkdir(parents=True)
            (directory/(ident+'.json')).write_text(json.dumps(dict(id=ident,legacy_id=2,date='2020-01-01',summary='Rescue')))
            with self.assertRaisesRegex(ValueError,'provenance'):data.read_records(root)
