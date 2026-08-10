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
process.env.ALERT_EMAIL = 'ale@example.com';
process.env.RESEND_API_KEY = 'dummy_resend_key';

// Test 6 below needs to simulate specific Supabase REST responses (order
// insert succeeds, order_items insert fails with a Postgres error) and
// observe the Resend alert email — everything else keeps hitting the real
// (unreachable) example.supabase.co host unmocked, same as before this was
// added, so tests 1-5 are untouched.
const realFetch = globalThis.fetch;
let mockFetch = null;
globalThis.fetch = (input, init) => (mockFetch ? mockFetch(input, init) : realFetch(input, init));

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

// 6. Hallazgo #1 (auditoría 10 ago 2026) — order_items insert failing must
// NOT be swallowed: it should throw (surfacing as 500 so Stripe retries),
// fire an internal alert with the failure detail, and must NOT send the
// customer confirmation email with fake/in-memory items for an order that
// has zero real order_items rows.
{
  const resendCalls = [];
  let sawOrderItemsInsert = false;

  mockFetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();

    if (url.startsWith('https://api.resend.com/')) {
      resendCalls.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: 'email_test' }), { status: 200 });
    }
    if (url.includes('/rest/v1/orders')) {
      if (method === 'GET') {
        return new Response(JSON.stringify({ code: 'PGRST116', message: 'no rows' }), { status: 406 });
      }
      return new Response(
        JSON.stringify({ id: 'order-uuid-1', number: 'RLV-2026-000001', status_token: 'tok123' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.includes('/rest/v1/order_items')) {
      sawOrderItemsInsert = true;
      return new Response(
        JSON.stringify({
          message: 'insert or update on table "order_items" violates foreign key constraint "order_items_frame_code_fkey"',
          code: '23503',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.includes('/rest/v1/sizes') || url.includes('/rest/v1/frames') || url.includes('/rest/v1/addons')) {
      // catalog tables unreachable -> calcUnitPriceCents falls back to dummyCatalog
      return new Response('Internal Server Error', { status: 500 });
    }
    if (url.includes('/rest/v1/places')) {
      return new Response(JSON.stringify({ code: 'PGRST116', message: 'no rows' }), { status: 406 });
    }
    throw new Error(`Unexpected fetch to ${url} in test 6`);
  };

  const items = [{ size_code: 'chico', frame_code: 'parota', place_slug: 'barcelona', qty: 1 }];
  const { payload, header } = signedPayload('checkout.session.completed', {
    id: 'cs_test_order_items_fail',
    customer_email: 'cliente@example.com',
    metadata: { items: JSON.stringify(items), is_gift: 'false', gift_message: '' },
  });
  const res = mockRes();
  await handler(mockReq('POST', payload, { 'stripe-signature': header }), res);
  mockFetch = null;

  assert.strictEqual(sawOrderItemsInsert, true);
  assert.strictEqual(res.statusCode, 500);
  assert.ok(
    resendCalls.some((c) => c.subject.includes('order_items insert failed')),
    `expected an alert email about the order_items failure, got: ${resendCalls.map((c) => c.subject).join(' | ')}`
  );
  assert.ok(
    !resendCalls.some((c) => c.to === 'cliente@example.com'),
    'must not send the customer confirmation email when order_items failed to insert'
  );
}

// 7. Hallazgo #7 (auditoría 10 ago 2026) — a concurrent delivery that loses
// the race on the new orders.stripe_session_id unique constraint (23505)
// must be treated as "already processed", returning 200 with no alert and
// no duplicate order_items/emails — not surfaced as a failure.
{
  const resendCalls = [];
  let sawOrderItemsInsert = false;

  mockFetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();

    if (url.startsWith('https://api.resend.com/')) {
      resendCalls.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: 'email_test' }), { status: 200 });
    }
    if (url.includes('/rest/v1/orders')) {
      if (method === 'GET') {
        return new Response(JSON.stringify({ code: 'PGRST116', message: 'no rows' }), { status: 406 });
      }
      // Another invocation won the race and inserted this stripe_session_id
      // first — simulates the unique constraint from
      // 20260810010001_orders_session_id_unique.sql rejecting our insert.
      return new Response(
        JSON.stringify({ message: 'duplicate key value violates unique constraint "orders_stripe_session_id_unique"', code: '23505' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.includes('/rest/v1/order_items')) {
      sawOrderItemsInsert = true;
      return new Response(JSON.stringify([]), { status: 201 });
    }
    // Resolve cleanly (not an unmatched throw, which makes postgrest-js's
    // retry/backoff kick in for no benefit — same lesson as test 6) so
    // place_id doesn't spuriously come back null and trip the "place_id
    // resolved to null" alert this test isn't about.
    if (url.includes('/rest/v1/places')) {
      return new Response(JSON.stringify({ id: 1, name: 'Barcelona' }), { status: 200 });
    }
    if (url.includes('/rest/v1/sizes') || url.includes('/rest/v1/frames') || url.includes('/rest/v1/addons')) {
      return new Response('Internal Server Error', { status: 500 });
    }
    throw new Error(`Unexpected fetch to ${url} in test 7`);
  };

  const items = [{ size_code: 'chico', frame_code: 'parota', place_slug: 'barcelona', qty: 1 }];
  const { payload, header } = signedPayload('checkout.session.completed', {
    id: 'cs_test_concurrent_dupe',
    customer_email: 'cliente2@example.com',
    metadata: { items: JSON.stringify(items), is_gift: 'false', gift_message: '' },
  });
  const res = mockRes();
  await handler(mockReq('POST', payload, { 'stripe-signature': header }), res);
  mockFetch = null;

  assert.strictEqual(res.statusCode, 200, `expected 200 (already processed), got ${res.statusCode} body=${JSON.stringify(res.body)}`);
  assert.strictEqual(sawOrderItemsInsert, false, 'must not insert order_items for the losing/duplicate invocation');
  assert.strictEqual(resendCalls.length, 0, 'must not alert or email for an expected concurrent-duplicate, not a real failure');
}

console.log('stripe webhook signature + event handling checks: OK');
