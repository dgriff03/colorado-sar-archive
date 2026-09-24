import json, sqlite3, tempfile, unittest
from pathlib import Path
from test_data import data
from locations import location_group

class LocationTests(unittest.TestCase):
    def test_reviewed_aliases_and_geographic_boundaries(self):
        self.assertEqual(location_group(dict(location='Mt. Bierstadt', county='Park')), 'Mount Bierstadt')
        self.assertEqual(location_group(dict(location="St Mary's Glacier Lake", county='Clear Creek')), "St. Mary's Glacier / Lake area")
        self.assertEqual(location_group(dict(location='Summit Lake', county='Clear Creek')), 'Summit Lake (Mount Blue Sky)')
        for location, county in [('Summit Lake', 'Routt'), ('Summit Lake', None),
                                 ('Bierstadt Lake, Rocky Mountain National Park', 'Larimer'),
                                 ('Mount Bierstadt / Mount Evans', 'Clear Creek'),
                                 ('Camp Rock (east of Summit Lake)', 'Clear Creek')]:
            self.assertEqual(location_group(dict(location=location, county=county)), location)

    def test_kelso_ridge_groups_with_torreys_but_not_shared_areas(self):
        for location in ['Kelso Ridge', 'Kelso Ridge (Torreys Peak)', "Torrey's Peak", 'Torreys Peak']:
            for county in ['Clear Creek', 'Clear Creek County']:
                self.assertEqual(location_group(dict(location=location, county=county)), 'Torreys Peak')
        for location in ['Grays and Torreys', 'Saddle of Grays and Torreys', 'Torreys and Grizzly Peak']:
            self.assertEqual(location_group(dict(location=location, county='Clear Creek')), location)

    def test_exports_preserve_original_and_include_group_everywhere(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            directory = root / 'data/incidents/2020'
            directory.mkdir(parents=True)
            record = dict(id='legacy-000001', date='2020-01-01', summary='Rescue', location='Mt Bierstadt', county='Clear Creek')
            source = directory / 'legacy-000001.json'
            source.write_text(json.dumps(record))
            original = source.read_bytes()
            data.build(root)
            for path in [root/'public/data/incidents.json', root/'public/data/incidents/legacy-000001.json']:
                exported = json.loads(path.read_text())
                if isinstance(exported, list): exported = exported[0]
                self.assertEqual(exported['location'], 'Mt Bierstadt')
                self.assertEqual(exported['location_group'], 'Mount Bierstadt')
            with sqlite3.connect(root/'public/data/colorado-sar.db') as db:
                self.assertEqual(db.execute('SELECT location, location_group FROM incidents').fetchone(), ('Mt Bierstadt', 'Mount Bierstadt'))
            self.assertEqual(source.read_bytes(), original)
