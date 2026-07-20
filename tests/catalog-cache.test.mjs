// Real data must be cacheable for an hour; the dummy fallback must never be
// cached, or a transient Supabase blip would serve fake data for an hour
// after Supabase recovers. See docs/superpowers/plans/2026-07-20-catalog-cache-fix.md.
// Run: node tests/catalog-cache.test.mjs
import assert from 'node:assert';

function mockRes() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function mockReq(method, query, body) {
  return { method, query, body };
}

// 1. Supabase unreachable -> dummy fallback -> must NOT be cached.
{
  process.env.SUPABASE_URL = 'https://not-configured.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'dummy';
  const { default: handler } = await import('../api/catalog.js?fallback');
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 7, 'expected the 7 dummy places');
  assert.strictEqual(res.headers['Cache-Control'], 'no-store', 'fallback must never be cached');
}

console.log('catalog cache checks: OK');
