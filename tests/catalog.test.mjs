// Minimal self-check for api/catalog.js's resource dispatch — the file that
// consolidates places/pricing/waitlist/orders into one function so the
// Vercel Hobby plan's 12-function cap has real margin.
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
  // Pre-existing test-scaffold bug found while verifying the 13 ago 2026
  // security-audit fixes: without `headers`, lib/rateLimit.js's clientIp()
  // throws on `req.headers[...]` before any handler logic runs, since
  // postWaitlist/postCurvaDeNivel/postPersonalizeRequest (and now
  // postPricing too — hallazgo 🟠 #6) call checkRateLimit before their own
  // validation. This crashed the whole test file at the waitlist test
  // (#4 below) even before today's changes — tests/checkout.test.mjs
  // already carries this exact fix and comment (added for its own
  // hallazgo #6, 10 ago 2026 audit).
  return { method, query, body, headers: {} };
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
  await handler(mockReq('POST', { resource: 'places' }), res);
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
// above resolves nowhere), reads serve the placeholder pieces instead of
// a 500 — this is the actual bug the fallback exists to fix.
//
// Fix (13 ago 2026, encontrado al verificar los cambios de la auditoría de
// seguridad): estas aserciones estaban desfasadas contra
// lib/dummyCatalog.js real desde 20260727010001_catalog_cleanup_and_puzzle.sql
// — DUMMY_PLACES tiene 6 lugares hoy (5 ciudades + 1 puzzle), no 7;
// 'monterrey' y el tipo 'f1'/'autodromo-hermanos-rodriguez' ya no existen
// (eran "dev-phase filler", removidos junto con el catálogo real). Este
// archivo nunca llegaba a ejecutar estas aserciones hasta ahora porque el
// bug de mockReq sin `headers` (arriba) crasheaba el test file dos
// aserciones antes, en waitlist — así que este desfase llevaba tiempo sin
// detectarse. Actualizado para usar los 6 lugares reales.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 6, 'expected the 6 dummy places');
}
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places', slug: 'barcelona' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.name, 'Barcelona');
}
// A slug that isn't in the dummy set still 404s — the fallback isn't a
// silent catch-all for typos.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places', slug: 'no-existe' }), res);
  assert.strictEqual(res.statusCode, 404);
}
// type filter (also the category taxonomy — src/lib/categories.js) still
// works against the dummy fallback. 'juego' (the puzzle) is the one type
// with exactly 1 match in the current 6-place set — same assertion shape
// as the original 'f1' test, just against real current data.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places', type: 'juego' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].slug, 'nevado-de-toluca');
}
// Pricing falls back to the hardcoded catalog mirror too.
// Fix (13 ago 2026, mismo hallazgo que el bloque de arriba): frame_code
// 'nogal' ya no existe en DUMMY_FRAMES (lib/dummyCatalog.js) — nunca fue
// un frame real y se quitó de ahí, aunque el código sigue vivo en
// src/lib/catalog.js's FRAMES solo por integridad de FK. 'parota' es el
// único frame real hoy.
{
  const res = mockRes();
  await handler(
    mockReq('POST', { resource: 'pricing' }, { size_code: 'mediano', frame_code: 'parota', addons: [] }),
    res
  );
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.unit_price, 129900);
}

// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #5 — un addon code
// desconocido se rechaza con 400 en vez de contar como $0 en silencio.
{
  const res = mockRes();
  await handler(
    mockReq('POST', { resource: 'pricing' }, { size_code: 'mediano', frame_code: 'parota', addons: ['inventado'] }),
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_addon');
}

// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #7 — q sobre el
// máximo de caracteres se rechaza antes de tocar la base de datos.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places', q: 'x'.repeat(101) }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_request');
}

// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #10 — session_id con
// formato inválido se rechaza antes de consultar Supabase.
{
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'orders_by_session', session_id: 'no-es-un-session-id' }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_request');
}

// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4
// — getPersonalizedPrice: mediano (129900) * 1.15 = 149385.
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'personalized_pricing' }, { size_code: 'mediano' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.unit_price, 149385);
}
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'personalized_pricing' }, { size_code: 'no-existe' }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_size');
}

console.log('catalog dispatch checks: OK');
