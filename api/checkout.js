// Issue #26: POST /api/checkout — validate items, recalculate price server-side
// (never trust the client), create a Stripe Checkout Session.
// Payment methods/MSI/shipping zones are configured in #27; this issue only
// needs a real Session with the recalculated total.
import Stripe from 'stripe';
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';
import { calcUnitPriceCents, PricingError } from '../lib/pricing.js';
import { checkRateLimit } from '../lib/rateLimit.js';

// new Stripe(undefined) throws synchronously at import time — same class
// of bug as the earlier lib/supabase.js one, and confirmed live: checkout
// was crashing with a raw Vercel FUNCTION_INVOCATION_FAILED (no error
// body at all) on every attempt, because STRIPE_SECRET_KEY isn't set yet.
// Guard construction so the module always loads, and reject with a clear,
// specific error instead — "checkout en configuración", not a button that
// silently does nothing.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

// Stripe caps each metadata VALUE at 500 characters. Confirmed live tonight:
// a 4-item cart (509 chars of JSON) made `items: JSON.stringify(items)`
// exceed that, Stripe's API rejected the session, and because the call
// wasn't wrapped in try/catch, that became an uncaught FUNCTION_INVOCATION_FAILED
// instead of a normal error — carts as small as 4 pieces could crash checkout
// outright. Split across multiple keys instead of one; the webhook
// (api/webhooks/stripe.js) reassembles them the same way.
const METADATA_CHUNK_SIZE = 450; // margin under Stripe's 500-char limit
function encodeItemsMetadata(items) {
  const json = JSON.stringify(items);
  const chunks = [];
  for (let i = 0; i < json.length; i += METADATA_CHUNK_SIZE) {
    chunks.push(json.slice(i, i + METADATA_CHUNK_SIZE));
  }
  const metadata = { items_chunks: String(chunks.length) };
  chunks.forEach((chunk, i) => {
    metadata[`items_${i}`] = chunk;
  });
  return metadata;
}

async function priceItem(item) {
  const { place_slug, custom_place, size_code, frame_code, color_code, capelo, plate_text, qty } = item;

  if (!place_slug && !custom_place) {
    throw new PricingError('invalid_item', 'Each item needs place_slug or custom_place');
  }

  const addons = [];
  if (capelo) addons.push('capelo');
  if (plate_text) addons.push('placa');

  // These three lookups are independent of each other — running them
  // sequentially (as this used to) adds two extra network round-trips to
  // Supabase per item for no reason; every millisecond here is on the
  // critical path between the customer clicking "pagar" and reaching Stripe.
  const [placeResult, colorResult, unit_price_cents] = await Promise.all([
    place_slug
      ? supabase.from('places').select('id, name').eq('slug', place_slug).maybeSingle()
      : Promise.resolve({ data: null }),
    color_code
      ? supabase.from('colors').select('code').eq('code', color_code).maybeSingle()
      : Promise.resolve({ data: null }),
    calcUnitPriceCents({ size_code, frame_code, addons }),
  ]);

  if (place_slug && !placeResult.data) {
    throw new PricingError('invalid_place', `Unknown place_slug: ${place_slug}`);
  }
  if (color_code && !colorResult.data) {
    throw new PricingError('invalid_color', `Unknown color_code: ${color_code}`);
  }
  const place = placeResult.data;
  const name = `Relieve · ${place?.name ?? custom_place} · ${size_code} · ${frame_code}`;

  return {
    place_id: place?.id ?? null,
    name,
    unit_price_cents,
    qty: qty && qty > 0 ? qty : 1,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  if (!stripe) {
    return sendError(res, 503, 'checkout_not_configured', 'El checkout todavía no está configurado.');
  }

  if (!(await checkRateLimit(req, res, { key: 'checkout', limit: 10, windowMs: 60_000 }))) return;

  const { items, is_gift = false, gift_message = null, email } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0 || !email) {
    return sendError(res, 400, 'invalid_request', 'items (non-empty) and email are required');
  }

  let priced;
  try {
    priced = await Promise.all(items.map(priceItem));
  } catch (err) {
    if (err instanceof PricingError) return sendError(res, 400, err.code, err.message);
    return sendError(res, 500, 'db_error', err.message);
  }

  const subtotal_cents = priced.reduce((sum, p) => sum + p.unit_price_cents * p.qty, 0);

  const line_items = priced.map((p) => ({
    price_data: {
      currency: 'mxn',
      unit_amount: p.unit_price_cents,
      product_data: { name: p.name },
    },
    quantity: p.qty,
  }));

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'mxn',
      customer_email: email,
      payment_method_types: ['card', 'oxxo'],
      shipping_address_collection: { allowed_countries: ['MX'] },
      line_items,
      metadata: {
        ...encodeItemsMetadata(items),
        is_gift: String(is_gift),
        gift_message: gift_message ?? '',
      },
      success_url: `${SITE_URL}/pedido/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: SITE_URL, // /carrito was a page, now the cart is a drawer (P2) — cart state persists in localStorage regardless
    });
  } catch (err) {
    // Defense in depth: whatever the reason a Stripe API call can fail
    // (this exact bug was a metadata size limit, but there are others —
    // rate limits, network errors, etc.), never let it crash the function
    // raw. Always return a real JSON error the frontend can show.
    console.error('[stripe] session creation failed', err);
    return sendError(res, 502, 'stripe_error', 'No pudimos iniciar el pago. Intenta de nuevo.');
  }

  // Best-effort checkout-attempt capture for the checkout-abandonado n8n
  // workflow. Deliberately fire-and-forget (not awaited) — this used to be
  // an awaited insert-then-update pair before the Stripe call, which put an
  // extra Supabase round-trip on the critical path between "pagar" and
  // reaching Stripe for no benefit to the customer. Now it's a single
  // insert with the session id already known, kicked off after we already
  // have everything the customer is waiting on.
  supabase
    .from('carts')
    .insert({ email, items: priced, subtotal_cents, stripe_session_id: session.id })
    .then(({ error }) => {
      if (error) console.error('[carts] failed to record checkout attempt', error);
    });

  return res.status(200).json({ url: session.url });
}
