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

console.log('catalog dispatch checks: OK');
