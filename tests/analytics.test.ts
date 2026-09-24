import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsPage } from '../lib/analytics.ts';
test('analytics strips queries, hashes, IDs and arbitrary paths', () => {
  for (const url of [
    'https://rescue.typetwo.dev/?q=Sensitive+Name&incident=legacy-000001#private',
    'https://example.com/sensitive-name?medical=private',
  ]) {
    assert.deepEqual(analyticsPage(url), {
      page_location: 'https://rescue.typetwo.dev/',
      page_title: 'Explore archive',
      page_referrer: '',
    });
  }
  assert.equal(
    analyticsPage('/faq/?q=private').page_location,
    'https://rescue.typetwo.dev/faq/',
  );
});
