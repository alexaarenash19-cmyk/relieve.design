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
//
// Deliberately NOT `signal: AbortSignal.timeout(3000)` passed straight
// through: verified twice (2026-07-20, Node v24.18.0) that routed through
// supabase-js's own fetch/retry stack, an AbortSignal.timeout()-created
// signal takes ~19s to actually abort a request to an unreachable host,
// vs. ~3s with a manually-managed AbortController. A bare `fetch()` call
// with AbortSignal.timeout() does abort at ~3s — the slowdown only shows up
// once postgrest-js's own request handling is in the loop. Don't "simplify"
// this back to the one-liner without re-measuring against an unreachable
// host through `supabase.from(...).select(...)`, not a bare fetch.
function timeoutFetch(input, init = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId),
  );
}

export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://not-configured.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'not-configured',
  { global: { fetch: timeoutFetch } },
);
