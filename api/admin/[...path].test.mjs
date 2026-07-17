// Minimal self-check for the consolidated admin catch-all's routing dispatch
// (issue #39, merged into one function so the Vercel function-count cap fits).
// Run: node "api/admin/[...path].test.mjs"
import assert from 'node:assert';

process.env.ADMIN_TOKEN = 'test-token';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('./[...path].js');

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

function mockReq(method, path, headers = {}, body = {}) {
  return { method, query: { path }, headers, body };
}

// 1. No token is rejected before any routing happens.
{
  const res = mockRes();
  await handler(mockReq('PATCH', ['orders', '1']), res);
  assert.strictEqual(res.statusCode, 401);
}

// 2. Valid token but unknown resource -> 404, not a crash.
{
  const res = mockRes();
  await handler(mockReq('POST', ['nope'], { authorization: 'Bearer test-token' }), res);
  assert.strictEqual(res.statusCode, 404);
}

// 3. Wrong method on a known resource is rejected before hitting the DB.
{
  const res = mockRes();
  await handler(mockReq('GET', ['orders', '1'], { authorization: 'Bearer test-token' }), res);
  assert.strictEqual(res.statusCode, 405);
}

// 4. /places with an id segment doesn't match (POST /api/admin/places has no id).
{
  const res = mockRes();
  await handler(mockReq('POST', ['places', '1'], { authorization: 'Bearer test-token' }), res);
  assert.strictEqual(res.statusCode, 404);
}

console.log('admin catch-all routing checks: OK');
