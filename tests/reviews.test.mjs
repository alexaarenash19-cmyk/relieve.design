// Minimal self-check for api/reviews.js's dummy fallback (mirrors
// tests/catalog.test.mjs's pattern for the same Supabase-unreachable case).
// Run: node tests/reviews.test.mjs
import assert from 'node:assert';
import http from 'node:http';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { default: handler } = await import('../api/reviews.js');

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

function mockReq(method, query) {
  // headers added (audit 10 ago 2026, same gap already found/fixed in
  // tests/checkout.test.mjs): handleGet now calls checkRateLimit, whose
  // clientIp() throws on req.headers[...] without this.
  return { method, query, headers: {} };
}

// place query param required.
{
  const res = mockRes();
  await handler(mockReq('GET', {}), res);
  assert.strictEqual(res.statusCode, 400);
}

// Supabase unreachable -> dummy reviews for a known dummy place, not a 500.
// Was asserting on 'monterrey', which the 6-piece catalog cleanup removed
// along with its DUMMY_REVIEWS entry — this test has been silently failing
// on every run since (no CI existed to catch it). 'ciudad-de-mexico' is the
// one place DUMMY_REVIEWS still covers.
{
  const res = mockRes();
  await handler(mockReq('GET', { place: 'ciudad-de-mexico' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.body.length >= 1, 'expected at least one dummy review for ciudad-de-mexico');
}

// Unknown slug -> empty list, not a fabricated review.
{
  const res = mockRes();
  await handler(mockReq('GET', { place: 'no-existe' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 0);
}

// POST /api/reviews needs a real multipart request (formidable parses the
// actual req stream, not something a plain {method, query} mock can fake) —
// spin up a real HTTP server around the handler instead.
async function withServer(fn) {
  const server = http.createServer((req, res) => {
    const wrapped = {
      setHeader: (k, v) => res.setHeader(k, v),
      status(code) {
        res.statusCode = code;
        return this;
      },
      json(payload) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
        return this;
      },
    };
    handler(req, wrapped).catch((err) => {
      res.statusCode = 500;
      res.end(String(err));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function reviewForm({ photoBytes, photoType = 'image/jpeg' }) {
  const form = new FormData();
  form.set('place_slug', 'londres');
  form.set('customer', 'Test User');
  form.set('city', 'CDMX');
  form.set('rating', '5');
  form.set('comment', 'Test');
  form.set('photo', new Blob([photoBytes], { type: photoType }), 'photo.jpg');
  return form;
}

const REAL_JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const SPOOFED_BYTES = Buffer.from('<?php echo "not an image"; ?>');

// Real JPEG bytes, correctly labeled -> passes photo validation. Supabase is
// the dummy example.com URL from the top of this file, so it can't find a
// real "londres" place row either way; the point here is that it does NOT
// get rejected as invalid_photo, proving the magic-byte check let it through.
{
  await withServer(async (url) => {
    const res = await fetch(`${url}/api/reviews`, { method: 'POST', body: reviewForm({ photoBytes: REAL_JPEG_BYTES }) });
    const body = await res.json();
    assert.notStrictEqual(body.error?.code, 'invalid_photo', `real JPEG should not be rejected as invalid_photo, got: ${JSON.stringify(body)}`);
  });
}

// Non-image bytes labeled image/jpeg -> the declared mimetype lies, but the
// real file signature doesn't match any allowed format -> rejected before
// ever reaching Supabase or storage.
{
  await withServer(async (url) => {
    const res = await fetch(`${url}/api/reviews`, { method: 'POST', body: reviewForm({ photoBytes: SPOOFED_BYTES, photoType: 'image/jpeg' }) });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error?.code, 'invalid_photo', `spoofed file should be rejected as invalid_photo, got: ${JSON.stringify(body)}`);
  });
}

// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #8 — comment sobre el
// límite de longitud se rechaza antes de la validación de foto (y antes
// de tocar Supabase).
{
  await withServer(async (url) => {
    const form = reviewForm({ photoBytes: REAL_JPEG_BYTES });
    form.set('comment', 'x'.repeat(1001));
    const res = await fetch(`${url}/api/reviews`, { method: 'POST', body: form });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error?.code, 'invalid_request', `overlong comment should be rejected, got: ${JSON.stringify(body)}`);
  });
}

console.log('reviews dummy-fallback checks: OK');
