// Issue #60 — alerting on webhook/order-creation/n8n failures. Deliberately
// minimal (decisions.md gap #1: "scope intentionally minimal, not a full
// observability stack") — a single best-effort email via Resend's HTTP API,
// same direct-fetch approach the n8n workflows already use (no SDK for one
// call site). Silent no-op if RESEND_API_KEY/ALERT_EMAIL aren't set, same
// pattern as api/checkout.js's guarded Stripe construction: an unconfigured
// optional feature must never crash the request it's attached to, and a
// failed alert email must never throw back into its caller either.
const ALERT_FROM = 'Relieve Alertas <contacto@relieve.design>';

export async function sendAlert(subject, detail) {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: ALERT_FROM,
        to: process.env.ALERT_EMAIL,
        subject: `[Relieve] ${subject}`,
        html: `<pre>${String(detail).slice(0, 4000)}</pre>`,
      }),
    });
  } catch (err) {
    console.error('[alerts] failed to send alert email', err);
  }
}
