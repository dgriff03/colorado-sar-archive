import json, sqlite3, tempfile, unittest
from pathlib import Path
from test_data import data
import places
from places import location_places


def tags(location, county='Pitkin', **extra):
    return location_places(dict(location=location, county=county, **extra))


class PlaceTests(unittest.TestCase):
    def test_config_references_resolve(self):
        for place in places.CONFIG['places']:
            for key in ('parents', 'admin', 'nearby'):
                for ref in place.get(key, []): self.assertIn(ref, places.PLACES, place['id'])
        self.assertEqual(len({p['id'] for p in places.CONFIG['places']}), len(places.CONFIG['places']))
        groups = {g['name'] for g in json.loads((Path(__file__).parents[1]/'config/location-groups.json').read_text())}
        self.assertEqual(set(places.BY_GROUP), groups)

    def test_maroon_bells_features(self):
        self.assertEqual(tags('North Maroon Peak, north face'), ['north-maroon-peak'])
        self.assertEqual(tags('West Face of South Maroon Peak'), ['maroon-peak'])
        self.assertEqual(tags('Maroon Bells traverse (~13,000 ft), Bell Chord couloir'), ['bell-cord-couloir', 'maroon-bells-traverse'])
        self.assertEqual(tags('Crater Lake Trail above Maroon Lake'), ['crater-lake-maroon', 'maroon-lake'])
        for id_ in ['maroon-peak', 'north-maroon-peak', 'bell-cord-couloir', 'maroon-bells-traverse', 'maroon-lake', 'crater-lake-maroon']:
            self.assertIn('maroon-bells-area', places.ANCESTORS[id_])

    def test_wilderness_mentions_do_not_become_the_bells(self):
        self.assertEqual(tags('Snowmass Lake, Maroon Bells-Snowmass Wilderness'), ['snowmass-lake'])
        self.assertEqual(tags('near Willow Pass, Maroon Bells-Snowmass Wilderness'), ['maroon-bells-snowmass-wilderness'])
        self.assertEqual(tags('Pyramid Peak summit saddle, Maroon-Bells-Snowmass Wilderness'), ['pyramid-peak'])
        self.assertEqual(tags('Maroon Creek Bridge, Highway 82, near Truscott / Aspen entrance'), [])

    def test_county_scope_and_scoped_aliases(self):
        self.assertEqual(tags('Crater Lake', county='Gilpin'), [])
        self.assertEqual(tags('Longs Peak', county='Eagle'), [])
        self.assertEqual(tags('K2 off Capitol Peak, Maroon Bells Wilderness Area'), ['capitol-k2'])
        self.assertEqual(tags('K2'), [])
        self.assertEqual(tags('Longs Peak, Keyhole Route', county='Boulder'), ['longs-keyhole'])
        self.assertEqual(tags('Mt. Sneffels, the keyhole', county='Ouray'), ['mount-sneffels'])
        self.assertEqual(tags('Diamond Lake area', county='Boulder'), [])

    def test_peak_field_is_not_evidence(self):
        self.assertEqual(tags('Capitol Creek Trail, ~4 miles up', peak='Capitol Peak'), ['capitol-creek'])
        self.assertEqual(tags('Nickelson Creek area', peak='Capitol Peak'), [])

    def test_exports_include_places(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); directory = root/'data/incidents/2020'; directory.mkdir(parents=True)
            record = dict(id='legacy-000001', date='2020-01-01', summary='Rescue', location='North Maroon Peak', county='Pitkin')
            (directory/'legacy-000001.json').write_text(json.dumps(record))
            data.build(root)
            exported = json.loads((root/'public/data/incidents.json').read_text())[0]
            self.assertEqual(exported['location_places'], ['north-maroon-peak'])
            self.assertEqual(exported['location'], 'North Maroon Peak')
            with sqlite3.connect(root/'public/data/colorado-sar.db') as db:
                self.assertEqual(json.loads(db.execute('SELECT location_places FROM incidents').fetchone()[0]), ['north-maroon-peak'])
                self.assertEqual(db.execute("SELECT parents FROM places WHERE id='north-maroon-peak'").fetchone()[0], '["maroon-bells-area"]')
