import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSiteUrl } from '../lib/site-url.ts';

test('public origin defaults and normalizes self-hosted origins', () => {
  assert.equal(normalizeSiteUrl(), 'https://rescue.typetwo.dev');
  assert.equal(normalizeSiteUrl('https://rescues.example.org/'), 'https://rescues.example.org');
  assert.equal(normalizeSiteUrl('http://localhost:3000'), 'http://localhost:3000');
});

test('rejects origins that would break canonical links or expose credentials', () => {
  for (const value of ['invalid', 'ftp://example.org', 'https://user:pass@example.org',
    'https://example.org/archive', 'https://example.org/?q=test', 'https://example.org/#fragment']) {
    assert.throws(() => normalizeSiteUrl(value));
  }
});
