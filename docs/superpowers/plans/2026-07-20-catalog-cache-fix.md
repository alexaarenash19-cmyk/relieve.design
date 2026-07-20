# Catalog Cache + Fail-Fast Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/api/places` and `/api/places/:slug` respond in under 1.5s cold and under 200ms warm, without ever caching the dummy-fallback response.

**Architecture:** This is a Vite + Vercel serverless-functions app (`api/catalog.js`, plain `@vercel/node`-style handlers) — **not Next.js**, so `export const revalidate` / `unstable_cache` from `next/cache` don't exist here. Caching is done two ways instead: (1) a `Cache-Control` response header on successful reads, which Vercel's CDN honors for Serverless Functions the same way it does for static assets; (2) a request-level timeout wrapped around the Supabase client's `fetch`, so an unreachable/misconfigured backend fails in ~3s instead of hanging for the platform's full default timeout (measured at 7.9s in production before today's fix).

**Tech Stack:** `@supabase/supabase-js` v2 (`lib/supabase.js`), Node's built-in `AbortSignal.timeout`, Vercel Serverless Functions. Tests are plain `assert`-based `.mjs` scripts run via `node tests/x.test.mjs` (no test framework — see `tests/catalog.test.mjs` for the existing pattern), wired into `package.json`'s `test` script.

## Global Constraints

- Cache TTL: 1 hour (`s-maxage=3600`) — confirmed acceptable turnaround for catalog/price edits to reach production.
- **Never cache the dummy-fallback response for the full TTL.** If Supabase errors, the response must be `Cache-Control: no-store` (or equivalent) — caching a fallback for an hour would silently serve fake data long after Supabase recovers. This is the exact bug this plan exists to avoid re-introducing.
- No new npm dependencies. `supabase-js` v2's `createClient` already accepts a custom `global.fetch`.
- Do not change the shape or content of the dummy-catalog fallback — only its latency and cacheability.
- Match existing test conventions: plain `.mjs` + `node:assert`, added to `package.json`'s `test` script chain, following `tests/catalog.test.mjs`'s mock `req`/`res` pattern.

---

### Task 1: Fail-fast timeout on the Supabase client

**Files:**
- Modify: `lib/supabase.js`
- Modify: `package.json` (add new test to the `test` script chain)
- Test: `tests/supabase-timeout.test.mjs` (create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `lib/supabase.js` still exports `supabase` (same shape/usage as today — `supabase.from(...).select(...)` etc.) — Task 2 relies on this being unchanged.

- [ ] **Step 1: Write the failing test**

```js
// tests/supabase-timeout.test.mjs
// Proves a request to an unreachable Supabase host aborts in ~3s instead of
// hanging for the platform's full default timeout (measured 7.9s in prod
// before this fix — see docs/superpowers/plans/2026-07-20-catalog-cache-fix.md).
// Run: node tests/supabase-timeout.test.mjs
import assert from 'node:assert';

// 10.255.255.1 is a non-routable "black hole" address commonly used to
// simulate an unreachable host without depending on external DNS/network.
process.env.SUPABASE_URL = 'http://10.255.255.1';
process.env.SUPABASE_SERVICE_KEY = 'dummy';

const { supabase } = await import('../lib/supabase.js');

const start = Date.now();
const { error } = await supabase.from('places').select('slug').limit(1);
const elapsed = Date.now() - start;

assert.ok(error, 'expected an error against an unreachable host');
assert.ok(elapsed < 4000, `expected abort within ~3s, took ${elapsed}ms`);

console.log(`supabase timeout check: OK (${elapsed}ms)`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/supabase-timeout.test.mjs`
Expected: FAIL — either hangs well past 4s or times out the test runner itself, because `lib/supabase.js` doesn't wrap `fetch` with a timeout yet.

- [ ] **Step 3: Write minimal implementation**

```js
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// createClient() throws synchronously on a missing/malformed URL or key —
// at module import time, before any per-request try/catch can run. With no
// env vars set (Supabase not connected yet in production), every function
// that imports this crashed outright, which is why the dummy-catalog
// fallback in api/catalog.js never got a chance to run. Fall back to a
// syntactically valid but unreachable URL so construction always succeeds;
// the resulting "unreachable" error then surfaces per-query, right where
// that fallback already handles it.
//
// The 3s abort below is what actually keeps that fallback fast: without it,
// a request to an unreachable/misconfigured host hangs for the platform's
// full default timeout (measured 7.9s in production, 2026-07-20) before the
// error branch even runs.
function timeoutFetch(input, init = {}) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(3000) });
}

export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://not-configured.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'not-configured',
  { global: { fetch: timeoutFetch } }
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/supabase-timeout.test.mjs`
Expected: `supabase timeout check: OK (30XXms)` — under 4000ms.

- [ ] **Step 5: Wire into the test script and run the full suite**

Edit `package.json`'s `test` script to add the new test in the chain (anywhere before `catalog.test.mjs` is fine since they don't share state):

```json
"test": "node tests/supabase-env.test.mjs && node tests/supabase-timeout.test.mjs && node tests/checkout-unconfigured.test.mjs && node tests/stripe-webhook.test.mjs && node tests/checkout.test.mjs && node tests/admin.test.mjs && node tests/catalog.test.mjs && node tests/reviews.test.mjs && node scripts/prerender.test.mjs && node src/lib/heroStages.test.mjs"
```

Run: `npm test`
Expected: all tests pass, including the existing `catalog.test.mjs` dummy-fallback assertions (still valid — this task doesn't change fallback behavior, only its speed).

- [ ] **Step 6: Commit**

```bash
git add lib/supabase.js tests/supabase-timeout.test.mjs package.json
git commit -m "fix: abort Supabase requests after 3s instead of hanging on unreachable host"
```

---

### Task 2: Cache successful catalog reads, never cache the fallback

**Files:**
- Modify: `api/catalog.js` (`getPlaces` and `getPlaceDetail` functions)
- Modify: `package.json` (add new test to the `test` script chain)
- Test: `tests/catalog-cache.test.mjs` (create)

**Interfaces:**
- Consumes: `supabase` from `lib/supabase.js` (Task 1, unchanged shape), existing `getPlaces`/`getPlaceDetail` control flow in `api/catalog.js:24-88`.
- Produces: no new exports — same `RESOURCES.places` handler, now sets `Cache-Control` differently depending on which branch (real data vs. dummy fallback) served the response.

- [ ] **Step 1: Write the failing test**

```js
// tests/catalog-cache.test.mjs
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
{
  process.env.SUPABASE_URL = 'https://not-configured.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'dummy';
  const { default: handler } = await import('../api/catalog.js?fallback');
  const res = mockRes();
  await handler(mockReq('GET', { resource: 'places' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 7, 'expected the 7 dummy places');
  assert.strictEqual(res.headers['Cache-Control'], 'no-store', 'fallback must never be cached');
}

console.log('catalog cache checks: OK');
```

(The `?fallback` query suffix on the dynamic import is a cache-buster so this file's module-level `supabase` client — created once at import time — picks up the env vars set immediately above, independent of any other test file that imported `../api/catalog.js` first.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/catalog-cache.test.mjs`
Expected: FAIL — `res.headers['Cache-Control']` is `undefined` today; no cache header is set at all.

- [ ] **Step 3: Write minimal implementation**

Edit `api/catalog.js`'s `getPlaces` (currently `api/catalog.js:24-56`):

```js
async function getPlaces(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { slug } = req.query;
  if (slug) return getPlaceDetail(req, res, slug);

  const { q, type } = req.query;

  let query = supabase
    .from('places')
    .select('slug, name, type, thumb_url, base_price_cents, status');

  if (q) query = query.ilike('name', `%${q}%`);
  if (type) query = query.eq('type', type);

  const { data, error } = await query.order('name');

  if (error) {
    res.setHeader('Cache-Control', 'no-store');
    const places = DUMMY_PLACES.filter(
      (p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!type || p.type === type)
    ).map(({ id, aerial_url, model_url, lat, lng, elevation_m, story, base_price_cents, ...p }) => ({
      ...p,
      base_price: base_price_cents,
    }));
    return res.status(200).json(places);
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  const places = data.map(({ base_price_cents, ...p }) => ({ ...p, base_price: base_price_cents }));
  return res.status(200).json(places);
}
```

Edit `getPlaceDetail` (currently `api/catalog.js:58-88`) the same way — `no-store` on the two error/dummy branches, the cache header on the real-data success branch:

```js
async function getPlaceDetail(req, res, slug) {
  const { data: place, error } = await supabase
    .from('places')
    .select(
      'id, slug, name, type, lat, lng, elevation_m, story, aerial_url, model_url, thumb_url, base_price_cents, status'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    res.setHeader('Cache-Control', 'no-store');
    const dummy = findDummyPlace(slug);
    if (!dummy) return sendError(res, 404, 'not_found', 'Place not found');
    const { id, base_price_cents, ...rest } = dummy;
    return res.status(200).json({ ...rest, base_price: base_price_cents, reviews_count: 0 });
  }

  if (!place) {
    res.setHeader('Cache-Control', 'no-store');
    return sendError(res, 404, 'not_found', 'Place not found');
  }

  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('approved', true)
    .eq('place_id', place.id);

  const { id, base_price_cents, ...rest } = place;
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    ...rest,
    base_price: base_price_cents,
    reviews_count: count ?? 0,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/catalog-cache.test.mjs`
Expected: `catalog cache checks: OK`

- [ ] **Step 5: Wire into the test script and run the full suite**

```json
"test": "node tests/supabase-env.test.mjs && node tests/supabase-timeout.test.mjs && node tests/checkout-unconfigured.test.mjs && node tests/stripe-webhook.test.mjs && node tests/checkout.test.mjs && node tests/admin.test.mjs && node tests/catalog.test.mjs && node tests/catalog-cache.test.mjs && node tests/reviews.test.mjs && node scripts/prerender.test.mjs && node src/lib/heroStages.test.mjs"
```

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add api/catalog.js tests/catalog-cache.test.mjs package.json
git commit -m "feat: cache real catalog reads for 1h, never cache the dummy fallback"
```

---

### Task 3: Deploy and verify against production

**Files:** none (verification only).

- [ ] **Step 1: Deploy to production**

```bash
npx vercel deploy --prod
```

- [ ] **Step 2: Verify cold-cache timing**

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" "https://relieve-web.vercel.app/api/places?_=$(date +%s)"
```

Expected: `200 <1.5s` (unique `_=` query param forces a cache miss).

- [ ] **Step 3: Verify warm-cache timing and header**

```bash
curl -s -D - -o /dev/null "https://relieve-web.vercel.app/api/places" | grep -i -E "x-vercel-cache|cache-control"
curl -s -o /dev/null -w "%{time_total}s\n" "https://relieve-web.vercel.app/api/places"
```

Expected: `x-vercel-cache: HIT` (or `STALE` on the immediate next request), `Cache-Control: public, s-maxage=3600, ...`, and `<0.2s`.

- [ ] **Step 4: Verify the detail endpoint**

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" "https://relieve-web.vercel.app/api/places/monterrey"
```

Expected: `200 <1.5s` on first hit, `<0.2s` on repeat.
