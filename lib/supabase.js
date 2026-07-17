import { createClient } from '@supabase/supabase-js';

// createClient() throws synchronously on a missing/malformed URL or key —
// at module import time, before any per-request try/catch can run. With no
// env vars set (Supabase not connected yet in production), every function
// that imports this crashed outright, which is why the dummy-catalog
// fallback in api/catalog.js never got a chance to run. Fall back to a
// syntactically valid but unreachable URL so construction always succeeds;
// the resulting "unreachable" error then surfaces per-query, right where
// that fallback already handles it.
export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://not-configured.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'not-configured'
);
