// Minimal self-check for issue #28 (signature verification), issue #30
// (payment_intent.payment_failed / checkout.session.expired handling), and
// issue #29's error path (checkout.session.completed with no live Supabase).
// Run: node tests/stripe-webhook.test.mjs

import assert from 'node:assert';
import { Readable } from 'node:stream';
import Stripe from 'stripe';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('../api/webhooks/stripe.js');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function signedPayload(type, object) {
  const payload = JSON.stringify({ id: 'evt_test', type, data: { object } });
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  return { payload, header };
}

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

// 3. payment_intent.payment_failed is accepted and doesn't throw.
{
  const { payload, header } = signedPayload('payment_intent.payment_failed', {
    id: 'pi_test',
    last_payment_error: { message: 'card_declined' },
  });
  const res = mockRes();
  await handler(mockReq('POST', payload, { 'stripe-signature': header }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.type, 'payment_intent.payment_failed');
}

// 4. checkout.session.expired is accepted and doesn't throw.
{
  const { payload, header } = signedPayload('checkout.session.expired', {
    id: 'cs_test',
  });
  const res = mockRes();
  await handler(mockReq('POST', payload, { 'stripe-signature': header }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.type, 'checkout.session.expired');
}

// 5. checkout.session.completed without a reachable Supabase surfaces a 500
// (so Stripe retries) instead of silently swallowing the failure.
{
  const { payload, header } = signedPayload('checkout.session.completed', {
    id: 'cs_test_2',
    customer_email: 'a@b.com',
    metadata: { items: '[]', is_gift: 'false', gift_message: '' },
  });
  const res = mockRes();
  await handler(mockReq('POST', payload, { 'stripe-signature': header }), res);
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.error.code, 'order_creation_failed');
}

console.log('stripe webhook signature + event handling checks: OK');
