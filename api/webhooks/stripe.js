// Issue #28: signature verification. Issue #30: payment_intent.payment_failed
// and checkout.session.expired handling. Order creation from
// checkout.session.completed is out of scope here — see #29.

import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res
      .status(405)
      .json({ error: { code: 'method_not_allowed', message: 'Use POST' } });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res
      .status(400)
      .json({ error: { code: 'invalid_signature', message: err.message } });
  }

  switch (event.type) {
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.error('[stripe] payment_intent.payment_failed', {
        id: pi.id,
        last_payment_error: pi.last_payment_error?.message,
      });
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      console.warn('[stripe] checkout.session.expired', { id: session.id });
      break;
    }
    default:
      break;
  }

  return res.status(200).json({ received: true, type: event.type });
}
