// Regression check for the actual bug behind live checkout crashing:
// new Stripe(undefined) throws synchronously at import time. Run in its
// own process (see package.json) with STRIPE_SECRET_KEY unset —
// production's actual state until real keys are configured.
import assert from 'node:assert';

assert.strictEqual(process.env.STRIPE_SECRET_KEY, undefined, 'this test must run with no Stripe key set');
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('../api/checkout.js');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    setHeader() {},
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

const res = mockRes();
await handler(
  { method: 'POST', body: { items: [{ place_slug: 'monterrey', size_code: 'mediano', frame_code: 'nogal' }], email: 'a@b.com' } },
  res
);
assert.strictEqual(res.statusCode, 503, 'expected a clear 503, not a crash');
assert.strictEqual(res.body.error.code, 'checkout_not_configured');

console.log('checkout survives missing Stripe key: OK');
