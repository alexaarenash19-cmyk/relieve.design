// Minimal self-check for issue #63's HTML templating (title/meta/JSON-LD).
// Run: node scripts/prerender.test.mjs
import assert from 'node:assert';
import { buildPlaceHtml } from './prerender.mjs';

const template = '<html><head><title>Relieve</title></head><body></body></html>';
const place = {
  name: 'Monterrey',
  story: 'Rodeada por la Sierra Madre Oriental.',
  thumb_url: null,
  base_price_cents: 129900,
};

const html = buildPlaceHtml(template, place);

assert.ok(html.includes('<title>Monterrey — Relieve</title>'));
assert.ok(html.includes('Rodeada por la Sierra Madre Oriental'));
assert.ok(html.includes('"@type":"Product"'));
assert.ok(html.includes('"price":"1299.00"'));

console.log('prerender templating checks: OK');
