// Minimal self-check for issue #28 (signature verification only).
// Run: node api/webhooks/stripe.test.mjs

import assert from 'node:assert';
import { Readable } from 'node:stream';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';

const { default: handler } = await import('./stripe.js');

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

function mockReq(method, body, headers = {}) {
  const req = Readable.from([body ?? '']);
  req.method = method;
  req.headers = headers;
  return req;
}

// 1. Non-POST is rejected.
{
  const res = mockRes();
  await handler(mockReq('GET'), res);
  assert.strictEqual(res.statusCode, 405);
}

// 2. Invalid/missing signature is rejected, no side effects.
{
  const res = mockRes();
  await handler(
    mockReq('POST', '{"type":"checkout.session.completed"}', {
      'stripe-signature': 'bad',
    }),
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_signature');
}

console.log('stripe webhook signature checks: OK');
