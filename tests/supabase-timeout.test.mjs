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
