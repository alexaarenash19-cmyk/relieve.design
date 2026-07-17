// Minimal self-check for api/reviews.js's dummy fallback (mirrors
// tests/catalog.test.mjs's pattern for the same Supabase-unreachable case).
// Run: node tests/reviews.test.mjs
import assert from 'node:assert';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('../api/reviews.js');

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

function mockReq(method, query) {
  return { method, query };
}

// place query param required.
{
  const res = mockRes();
  await handler(mockReq('GET', {}), res);
  assert.strictEqual(res.statusCode, 400);
}

// Supabase unreachable -> dummy reviews for a known dummy place, not a 500.
{
  const res = mockRes();
  await handler(mockReq('GET', { place: 'monterrey' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.length >= 1, 'expected at least one dummy review for monterrey');
  assert.ok(res.body[0].photo_url, 'expected the monterrey dummy review to include a photo');
}

// Unknown slug -> empty list, not a fabricated review.
{
  const res = mockRes();
  await handler(mockReq('GET', { place: 'no-existe' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 0);
}

console.log('reviews dummy-fallback checks: OK');
