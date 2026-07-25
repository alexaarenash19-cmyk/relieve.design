import { supabase } from './supabase.js';
import { sendError } from './errors.js';

const DEFAULT_WINDOW_MS = 60_000;

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

// Best-effort, Supabase-backed sliding window — chosen over adding
// Redis/Upstash since Supabase is already in the stack and this volume
// doesn't need dedicated infra. Not perfectly race-free under heavy
// concurrent load from a single IP, but that's an acceptable tradeoff for
// abuse/spam protection, not billing-grade precision.
//
// Returns true if the request may proceed. On rate_limited, this already
// sent the 429 response — callers must `return` immediately without
// sending anything else.
export async function checkRateLimit(req, res, { key, limit, windowMs = DEFAULT_WINDOW_MS }) {
  const bucketKey = `${key}:${clientIp(req)}`;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from('rate_limit_hits')
    .select('id', { count: 'exact', head: true })
    .eq('bucket_key', bucketKey)
    .gte('created_at', since);

  if (error) {
    // Fail open: never block real traffic because the rate limiter's own
    // DB call failed — that would turn a monitoring feature into an outage.
    console.error('[rate-limit] check failed, allowing request', error);
    return true;
  }

  if (count >= limit) {
    sendError(res, 429, 'rate_limited', 'Demasiadas solicitudes. Intenta de nuevo en un momento.');
    return false;
  }

  // Fire-and-forget: recording the hit isn't on the critical path of the
  // request it's gating.
  supabase
    .from('rate_limit_hits')
    .insert({ bucket_key: bucketKey })
    .then(({ error: insertError }) => {
      if (insertError) console.error('[rate-limit] failed to record hit', insertError);
    });

  return true;
}
