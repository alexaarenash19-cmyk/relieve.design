// Minimal self-check for api/catalog.js's resource dispatch — the file that
// consolidates collections/places/pricing/waitlist/orders into one function
// so the Vercel Hobby plan's 12-function cap has real margin.
// Run: node tests/catalog.test.mjs
import assert from 'node:assert';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('../api/catalog.js');

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

// 1. Unknown resource -> 404, not a crash.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'nope' }), res);
  assert.strictEqual(res.statusCode, 404);
}

// 2. Wrong method on a known resource is rejected before hitting the DB.
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'collections' }), res);
  assert.strictEqual(res.statusCode, 405);
}
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'pricing' }), res);
  assert.strictEqual(res.statusCode, 405);
}
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'waitlist' }), res);
  assert.strictEqual(res.statusCode, 405);
}

// 3. pricing's own request validation still runs (guard before DB lookup).
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'pricing' }, {}), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_request');
}

// 4. waitlist's own request validation still runs.
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'waitlist' }, {}), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_request');
}

// 5. Dummy catalog fallback (P0): with Supabase unreachable (SUPABASE_URL
// above resolves nowhere), reads serve the 5 placeholder pieces instead of
// a 500 — this is the actual bug the fallback exists to fix.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'collections' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.length >= 1, 'expected at least the dummy collection');
}
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 5, 'expected the 5 dummy places');
}
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places', slug: 'monterrey' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.name, 'Monterrey');
}
// A slug that isn't in the dummy set still 404s — the fallback isn't a
// silent catch-all for typos.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places', slug: 'no-existe' }), res);
  assert.strictEqual(res.statusCode, 404);
}
// Pricing falls back to the hardcoded catalog mirror too.
{
  const res = mockRes();
  await handler(
    mockReq('POST', { resource: 'pricing' }, { size_code: 'mediano', frame_code: 'nogal', addons: [] }),
    res
  );
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.unit_price, 129900);
}

console.log('catalog dispatch checks: OK');
