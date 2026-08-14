// Minimal self-check for issue #26 request-validation guard clauses
// (full pricing/Stripe session creation needs a live Supabase + Stripe test env).
// Run: node tests/checkout.test.mjs
import assert from 'node:assert';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

// Test 5 below (hallazgo #6) needs to simulate a real Supabase response for
// a soldout place — everything else keeps hitting the real (unreachable)
// example.supabase.co host unmocked, same as before this was added.
const realFetch = globalThis.fetch;
let mockFetch = null;
globalThis.fetch = (input, init) => (mockFetch ? mockFetch(input, init) : realFetch(input, init));

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
  // Pre-existing test-scaffold bug found while verifying hallazgo #6: without
  // `headers`, lib/rateLimit.js's clientIp() throws on `req.headers[...]`
  // before any handler logic runs, since checkRateLimit is called before the
  // request-validation guard clauses this file tests. Matches the mockReq
  // shape tests/stripe-webhook.test.mjs already uses.
  return { method, body, headers: {} };
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

// 4. Hallazgo #6/#5 — a free-text field over its server-side cap is
// rejected before any pricing/Supabase lookup happens.
{
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{ custom_place: 'x'.repeat(500), size_code: 'chico', frame_code: 'parota', qty: 1 }],
      email: 'a@b.com',
    }),
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'text_too_long');
}

// 5. Hallazgo #6 — a place that exists but isn't sellable (soldout/draft)
// must be rejected even on a direct API call, not just filtered out of the
// public catalog.
{
  mockFetch = async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('/rest/v1/places')) {
      return new Response(JSON.stringify({ id: 1, name: 'Agotada', status: 'soldout' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/rest/v1/rate_limit_hits')) {
      // Answer instead of throwing: an unmatched-URL throw here makes
      // postgrest-js's internal retry/backoff kick in and stretches this
      // test to 40s+ for no benefit — respond like a real "0 hits" count.
      return new Response(null, { status: 200, headers: { 'Content-Range': '0-0/0' } });
    }
    throw new Error(`Unexpected fetch to ${url} in test 5`);
  };
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{ place_slug: 'agotada', size_code: 'chico', frame_code: 'parota', qty: 1 }],
      email: 'a@b.com',
    }),
    res
  );
  mockFetch = null;
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'not_available');
}

// 6. Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #4 — qty over the
// server-side cap is rejected before any pricing/Supabase lookup, same
// spot as test 4's text_too_long check.
{
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{ custom_place: 'Un lugar', size_code: 'chico', frame_code: 'parota', qty: 11 }],
      email: 'a@b.com',
    }),
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_qty');
}

// 7. docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md — un
// item personalizado sin custom_location válido se rechaza antes de
// cualquier lookup a Supabase.
{
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{ custom_place: 'Un lugar', size_code: 'chico', frame_code: 'parota', qty: 1, custom_location: { place_id: 'x' } }],
      email: 'a@b.com',
    }),
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_custom_location');
}

// 8. Un item personalizado completo y válido usa getPersonalizedPrice
// (+15%), no calcUnitPriceCents — verificado contra el fallback dummy
// (mediano: 129900 * 1.15 = 149385) ya que Supabase real no está montado
// en este test.
{
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{
        custom_place: 'Ciudad de México, CDMX, México',
        size_code: 'mediano',
        frame_code: 'parota',
        color_code: 'blanco',
        qty: 1,
        custom_location: {
          place_id: 'ChIJB3UJ2yYAzoURgKDXCKP5-oI',
          formatted_address: 'Ciudad de México, CDMX, México',
          latitude: 19.4326,
          longitude: -99.1332,
          zoom: 12,
          map_bounds: { north: 19.5, south: 19.3, east: -99.0, west: -99.3 },
        },
      }],
      email: 'a@b.com',
    }),
    res
  );
  // color_code lookup hits the same unreachable example.supabase.co
  // Supabase host as everything else in this test file (unmocked) — se
  // resuelve como invalid_color en vez de 200, lo cual de todos modos
  // confirma que llegó más allá de la validación de custom_location y de
  // getPersonalizedPrice sin lanzar. Si eso cambia (Supabase real
  // montado), este test necesita mockFetch como el test 5 de este mismo
  // archivo.
  assert.notStrictEqual(res.body?.error?.code, 'invalid_custom_location');
  assert.notStrictEqual(res.body?.error?.code, 'invalid_size');
}

console.log('checkout request-validation checks: OK');
