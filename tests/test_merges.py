import json, sqlite3, tempfile, unittest
from pathlib import Path
from test_data import data
from merges import incident_merges

class MergeTests(unittest.TestCase):
    def test_duplicate_counted_once_and_old_id_resolves_after_rebuild(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); directory=root/'data/incidents/2018'; directory.mkdir(parents=True)
            for n in [1,2]:
                record=dict(id=f'legacy-00000{n}', date='2018-07-02', summary='Climber rescue', location='Lone Eagle Peak')
                (directory/(record['id']+'.json')).write_text(json.dumps(record))
            data.build(root)
            originals={p:p.read_bytes() for p in directory.glob('*.json')}
            (root/'config').mkdir()
            (root/'config/incident-merges.json').write_text(json.dumps({'legacy-000002':dict(into='legacy-000001',reason='Confirmed same rescue')}))
            data.build(root)
            rows=json.loads((root/'public/data/incidents.json').read_text())
            self.assertEqual([r['id'] for r in rows], ['legacy-000001'])
            self.assertEqual(rows[0]['merged_ids'], ['legacy-000002'])
            alias=json.loads((root/'public/data/incidents/legacy-000002.json').read_text())
            self.assertEqual(alias['id'], 'legacy-000001')
            with sqlite3.connect(root/'public/data/colorado-sar.db') as db:
                self.assertEqual(db.execute('SELECT count(*) FROM incidents').fetchone()[0], 1)
                self.assertEqual(db.execute('SELECT id, canonical_id FROM incident_aliases').fetchone(), ('legacy-000002','legacy-000001'))
            for p, original in originals.items():self.assertEqual(p.read_bytes(),original)

    def test_invalid_merges_fail_validation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); (root/'config').mkdir();path=root/'config/incident-merges.json'
            cases=[{'a':dict(into='missing',reason='review')}, {'a':dict(into='a',reason='review')},
                   {'a':dict(into='b',reason='review'),'b':dict(into='c',reason='review')},
                   {'a':dict(into='b',reason='')}, {'a':dict(into='b',reason=3)}]
            for merges in cases:
                path.write_text(json.dumps(merges))
                with self.subTest(merges=merges), self.assertRaises(ValueError):
                    incident_merges(root,[dict(id=x) for x in ['a','b','c']])
