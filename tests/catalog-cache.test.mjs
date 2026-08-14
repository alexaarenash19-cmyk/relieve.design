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
// Fix (13 ago 2026, mismo hallazgo que tests/catalog.test.mjs's fix en PR
// #209): esta aserción tenía su propia copia desfasada del conteo de
// DUMMY_PLACES desde 20260727010001_catalog_cleanup_and_puzzle.sql — son
// 6 lugares reales hoy (5 ciudades + 1 puzzle), no 7. Archivo independiente
// de tests/catalog.test.mjs, nunca se tocó en esa auditoría.
{
  process.env.SUPABASE_URL = 'https://not-configured.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'dummy';
  const { default: handler } = await import('../api/catalog.js?fallback');
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 6, 'expected the 6 dummy places');
  assert.strictEqual(res.headers['Cache-Control'], 'no-store', 'fallback must never be cached');
}

console.log('catalog cache checks: OK');
