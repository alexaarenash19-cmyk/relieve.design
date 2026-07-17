// Regression check for the actual production bug behind the reported 500s:
// createClient() throws synchronously on a missing URL/key, at import time,
// before any per-request fallback can run. Every other test sets fake env
// vars before importing lib/supabase.js, which hid this. Run in its own
// process (see package.json) with SUPABASE_URL/SUPABASE_SERVICE_KEY unset —
// production's actual state until Supabase is connected.
import assert from 'node:assert';

assert.strictEqual(process.env.SUPABASE_URL, undefined, 'this test must run with no Supabase env vars set');

await import('../lib/supabase.js');

console.log('supabase client survives missing env vars: OK');
