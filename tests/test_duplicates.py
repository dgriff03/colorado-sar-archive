import sys, unittest, uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from duplicates import find_candidates, sources

class DuplicateTests(unittest.TestCase):
    def record(self, **changes):
        r=dict(id=str(uuid.uuid4()),date='2026-08-04',summary='Hiker rescued with a broken ankle on Longs Peak',location='Longs Peak',county='Larimer',source_urls='https://example.org/rescue')
        r.update(changes)
        return (Path('pending')/(r['id']+'.json'),r)
    def test_identical_content_with_different_ids_is_blocking(self):
        a=self.record();b=self.record()
        m=find_candidates([a],[b]);self.assertEqual(len(m),1);self.assertTrue(m[0]['blocking'])
    def test_same_payload_in_pending_batch(self):
        m=find_candidates([],[self.record(),self.record()]);self.assertTrue(m[0]['blocking'])
    def test_paraphrase_nearby_date_is_review_only(self):
        a=self.record();b=self.record(date='2026-08-05',summary='Hiker with a broken ankle rescued from Longs Peak',source_urls='https://another.org/rescue')
        m=find_candidates([a],[b]);self.assertEqual(len(m),1);self.assertFalse(m[0]['blocking'])
    def test_shared_annual_report_does_not_match_unrelated_rescues(self):
        accepted=[self.record(date=f'2026-08-{n:02}',summary=f'Snowmobile search number {n}',location='Vail',county='Eagle') for n in range(1,12)]
        self.assertEqual(find_candidates(accepted,[self.record()]),[])
    def test_single_article_can_describe_different_events(self):
        a=self.record();b=self.record(summary='Lost snowmobilers stranded in blizzard',location='Vail',county='Eagle')
        self.assertEqual(find_candidates([a],[b]),[])
    def test_repeated_rescue_month_later_without_shared_source_not_flagged(self):
        a=self.record();b=self.record(date='2026-09-04',source_urls='https://example.org/other')
        self.assertEqual(find_candidates([a],[b]),[])
    def test_shared_source_and_similar_title_find_date_disagreement(self):
        a=self.record();b=self.record(date='2026-09-04')
        m=find_candidates([a],[b]);self.assertEqual(len(m),1);self.assertIn('date disagreement',' '.join(m[0]['reasons']))
    def test_url_normalization_retains_article_identity(self):
        a=self.record(source_urls='http://www.example.org/report?id=1&utm_source=x#anchor')[1]
        b=self.record(source_urls='https://example.org/report?id=1')[1]
        c=self.record(source_urls='https://example.org/report?id=2')[1]
        self.assertEqual(sources(a),sources(b));self.assertNotEqual(sources(b),sources(c))
    def test_distinct_agency_mission_numbers_are_not_duplicate_candidates(self):
        a=self.record(summary='Injured party on Longs Peak (26-10)',responding_agency='Mountain Rescue')
        b=self.record(summary='Injured party on Longs Peak (26-11)',responding_agency='Mountain Rescue')
        self.assertEqual(find_candidates([a],[b]),[])
    def test_accepted_legacy_candidates_do_not_block(self):
        a=self.record();b=self.record();m=find_candidates([a,b],[],all_records=True)
        self.assertFalse(m[0]['blocking']);self.assertEqual(find_candidates([a,b],[]),[])
