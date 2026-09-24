import importlib.util, json, sqlite3, tempfile, unittest, uuid
from pathlib import Path
spec=importlib.util.spec_from_file_location('data',Path(__file__).parents[1]/'scripts/data.py')
data=importlib.util.module_from_spec(spec); spec.loader.exec_module(data)
class DataTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name); (self.root/'pending').mkdir()
    def tearDown(self): self.tmp.cleanup()
    def record(self, **extra):
        return dict(id=str(uuid.uuid4()),date='2026-08-04',summary='Injured hiker on Longs Peak',location='Longs Peak',source_urls='https://example.org/report',**extra)
    def write(self,r):
        p=self.root/'pending'/(r['id']+'.json');p.write_text(json.dumps(r));return p
    def test_promote_and_export_roundtrip(self):
        r=self.record(victims=0,notes='Details unknown');p=self.write(r)
        data.promote(self.root);self.assertFalse(p.exists());data.promote(self.root);data.build(self.root)
        db=sqlite3.connect(self.root/'public/data/colorado-sar.db');db.row_factory=sqlite3.Row
        row=dict(db.execute('select * from incidents').fetchone());db.close()
        for key,value in r.items():self.assertEqual(row[key],value)
        self.assertEqual(json.loads((self.root/'public/data/incidents.json').read_text())[0]['id'],r['id'])
    def test_batch_is_validated_before_any_moves(self):
        a=self.write(self.record());r=self.record();r['date']='2026-02-30';b=self.write(r)
        with self.assertRaises(ValueError):data.promote(self.root)
        self.assertTrue(a.exists());self.assertTrue(b.exists())
    def test_duplicates_rejected(self):
        r=self.record();self.write(r);accepted=self.root/'data/incidents/2026';accepted.mkdir(parents=True);(accepted/(r['id']+'.json')).write_text(json.dumps(r))
        with self.assertRaises(ValueError):data.read_records(self.root)
    def test_mismatched_filename_rejected(self):
        r=self.record();p=self.write(r);p.rename(p.parent/(str(uuid.uuid4())+'.json'))
        with self.assertRaises(ValueError):data.read_records(self.root)
    def test_unsafe_source_rejected(self):
        r=self.record();r['source_urls']='javascript:alert(1)';self.write(r)
        with self.assertRaises(ValueError):data.read_records(self.root)
    def test_reserved_legacy_id_rejected(self):
        r=self.record();r['id']='legacy-000001';self.write(r)
        with self.assertRaises(ValueError):data.read_records(self.root)
    def test_pending_not_published(self):
        self.write(self.record());data.build(self.root)
        self.assertEqual(json.loads((self.root/'public/data/incidents.json').read_text()),[])
    def test_nonfinite_number_rejected(self):
        self.write(self.record(detail_score=float('nan')))
        with self.assertRaises(ValueError):data.read_records(self.root)
    def test_identical_submission_blocks_entire_promotion(self):
        a=self.write(self.record());b=self.write(self.record())
        with self.assertRaisesRegex(ValueError, 'identical submission'):data.promote(self.root)
        self.assertTrue(a.exists());self.assertTrue(b.exists())
    def test_weather_fields_are_rejected(self):
        self.write(self.record(wx_high_f=50))
        with self.assertRaisesRegex(ValueError, 'unknown fields'):data.read_records(self.root)
    def test_unknown_fields_rejected(self):
        self.write(self.record(private_email='not for publication'))
        with self.assertRaises(ValueError):data.read_records(self.root)
if __name__=='__main__':unittest.main()
