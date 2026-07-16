// Issue #26: POST /api/checkout — validate items, recalculate price server-side
// (never trust the client), create a Stripe Checkout Session.
// Payment methods/MSI/shipping zones are configured in #27; this issue only
// needs a real Session with the recalculated total.
import Stripe from 'stripe';
import { supabase } from './_lib/supabase.js';
import { sendError } from './_lib/errors.js';
import { calcUnitPriceCents, PricingError } from './_lib/pricing.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

async function priceItem(item) {
  const { place_slug, custom_place, size_code, frame_code, color_code, capelo, plate_text, qty } = item;

  if (!place_slug && !custom_place) {
    throw new PricingError('invalid_item', 'Each item needs place_slug or custom_place');
  }

  let place = null;
  if (place_slug) {
    const { data } = await supabase
      .from('places')
      .select('id, name')
      .eq('slug', place_slug)
      .maybeSingle();
    if (!data) throw new PricingError('invalid_place', `Unknown place_slug: ${place_slug}`);
    place = data;
  }

  if (color_code) {
    const { data: color } = await supabase
      .from('colors')
      .select('code')
      .eq('code', color_code)
      .maybeSingle();
    if (!color) throw new PricingError('invalid_color', `Unknown color_code: ${color_code}`);
  }

  const addons = [];
  if (capelo) addons.push('capelo');
  if (plate_text) addons.push('placa');

  const unit_price_cents = await calcUnitPriceCents({ size_code, frame_code, addons });
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

  const line_items = priced.map((p) => ({
    price_data: {
      currency: 'mxn',
      unit_amount: p.unit_price_cents,
      product_data: { name: p.name },
    },
    quantity: p.qty,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'mxn',
    customer_email: email,
    payment_method_types: ['card', 'oxxo'],
    shipping_address_collection: { allowed_countries: ['MX'] },
    line_items,
    metadata: {
      items: JSON.stringify(items),
      is_gift: String(is_gift),
      gift_message: gift_message ?? '',
    },
    success_url: `${SITE_URL}/pedido/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/carrito`,
  });

  return res.status(200).json({ url: session.url });
}
