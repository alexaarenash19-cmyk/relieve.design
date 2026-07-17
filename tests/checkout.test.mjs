// Minimal self-check for issue #26 request-validation guard clauses
// (full pricing/Stripe session creation needs a live Supabase + Stripe test env).
// Run: node tests/checkout.test.mjs
import assert from 'node:assert';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('../api/checkout.js');

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

function mockReq(method, body) {
  return { method, body };
}

// 1. Non-POST is rejected.
{
  const res = mockRes();
  await handler(mockReq('GET'), res);
  assert.strictEqual(res.statusCode, 405);
}

// 2. Missing items/email is rejected before any pricing lookup.
{
  const res = mockRes();
  await handler(mockReq('POST', {}), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_request');
}

// 3. Empty items array is rejected.
{
  const res = mockRes();
  await handler(mockReq('POST', { items: [], email: 'a@b.com' }), res);
  assert.strictEqual(res.statusCode, 400);
}

console.log('checkout request-validation checks: OK');
