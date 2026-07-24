// 5xx codes wrap errors we didn't craft ourselves — raw Postgres/Supabase/
// Stripe exception messages, which can name real columns/constraints/
// internals. Log the real message server-side and never put it in the
// response; 4xx codes are messages we wrote ourselves (validation, "unknown
// place_slug", etc.) and are meant to be read by the client, so those pass
// through unchanged.
export function sendError(res, status, code, message) {
  if (status >= 500) {
    console.error(`[${code}]`, message);
    return res
      .status(status)
      .json({ error: { code, message: 'An unexpected error occurred. Please try again.' } });
  }
  return res.status(status).json({ error: { code, message } });
}
