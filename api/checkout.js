// Issue #26: POST /api/checkout — validate items, recalculate price server-side
// (never trust the client), create a Stripe Checkout Session.
// Payment methods/MSI/shipping zones are configured in #27; this issue only
// needs a real Session with the recalculated total.
import Stripe from 'stripe';
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';
import { calcUnitPriceCents, getPersonalizedPrice, PricingError } from '../lib/pricing.js';
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

// Hallazgo #6 (auditoría 10 ago 2026, cubre también #5): estos campos de
// texto libre llegan del cliente sin sanitizar y hoy no tienen ningún tope
// server-side (memory_note sí tiene un maxLength=140 en Product.jsx, pero
// eso es solo cosmético — nada impide una llamada directa a la API con
// texto arbitrariamente largo). Límites conservadores, no confirmados por
// Ale — ajustar si define algo distinto. gift_message se queda bien debajo
// del límite duro de 500 caracteres por valor que Stripe impone en
// metadata (ver encodeItemsMetadata arriba), para fallar aquí con un 400
// claro en vez de con el 502 genérico de stripe_error.
const FREE_TEXT_LIMITS = {
  memory_note: 140,
  custom_place: 120,
  plate_text: 60,
  gift_message: 300,
};

function assertFreeTextLength(field, value) {
  if (value && String(value).length > FREE_TEXT_LIMITS[field]) {
    throw new PricingError(
      'text_too_long',
      `${field} exceeds ${FREE_TEXT_LIMITS[field]} characters`,
    );
  }
}

// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 5
// — "antes de pagar" también aplica server-side, no solo como gate del
// botón en el cliente (mismo principio que el resto de este archivo:
// nunca confiar en que el cliente ya validó). map_bounds usa el shape
// que google.maps.LatLngBounds.toJSON() produce.
function assertValidCustomLocation(loc) {
  if (!loc || typeof loc !== 'object') {
    throw new PricingError('invalid_custom_location', 'custom_location is required for personalized items');
  }
  const { place_id, formatted_address, latitude, longitude, map_bounds, zoom } = loc;
  if (!place_id || typeof place_id !== 'string' || place_id.length > 200) {
    throw new PricingError('invalid_custom_location', 'custom_location.place_id is invalid');
  }
  if (!formatted_address || typeof formatted_address !== 'string' || formatted_address.length > 200) {
    throw new PricingError('invalid_custom_location', 'custom_location.formatted_address is invalid');
  }
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw new PricingError('invalid_custom_location', 'custom_location.latitude is invalid');
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new PricingError('invalid_custom_location', 'custom_location.longitude is invalid');
  }
  if (typeof zoom !== 'number' || zoom < 0 || zoom > 22) {
    throw new PricingError('invalid_custom_location', 'custom_location.zoom is invalid');
  }
  if (
    !map_bounds ||
    typeof map_bounds.north !== 'number' ||
    typeof map_bounds.south !== 'number' ||
    typeof map_bounds.east !== 'number' ||
    typeof map_bounds.west !== 'number'
  ) {
    throw new PricingError('invalid_custom_location', 'custom_location.map_bounds is invalid');
  }
}

// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #4 — qty no tenía tope
// superior. No permite pagar de menos (el precio unitario se recalcula
// server-side de todos modos), pero sí dejaba mandar una cantidad absurda
// a Stripe. 10 es generoso para un regalo/pedido grande sin abrir la
// puerta a un carrito de miles de unidades.
const MAX_QTY = 10;

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

// Hallazgo #6 (auditoría 10 ago 2026) — mismo criterio que getPlaces
// (api/catalog.js) usa para el catálogo público, pero invertido: 'draft'
// está archivada (nunca vendible) y 'soldout' se muestra en el sitio
// precisamente para empujar al visitante hacia WaitlistDialog en vez de
// comprarla — dejarla pasar aquí saltaría esa regla de negocio por una
// llamada directa a la API. 'preorder' sí es vendible por definición.
const SELLABLE_STATUSES = new Set(['active', 'preorder']);

async function priceItem(item) {
  const { place_slug, custom_place, size_code, frame_code, color_code, capelo, plate_text, memory_note, qty } = item;

  if (!place_slug && !custom_place) {
    throw new PricingError('invalid_item', 'Each item needs place_slug or custom_place');
  }
  assertFreeTextLength('custom_place', custom_place);
  assertFreeTextLength('plate_text', plate_text);
  assertFreeTextLength('memory_note', memory_note);

  const resolvedQty = qty && qty > 0 ? qty : 1;
  if (resolvedQty > MAX_QTY) {
    throw new PricingError('invalid_qty', `qty must be between 1 and ${MAX_QTY}`);
  }

  const addons = [];
  if (capelo) addons.push('capelo');
  if (plate_text) addons.push('placa');

  if (item.custom_location) assertValidCustomLocation(item.custom_location);

  // These three lookups are independent of each other — running them
  // sequentially (as this used to) adds two extra network round-trips to
  // Supabase per item for no reason; every millisecond here is on the
  // critical path between the customer clicking "pagar" and reaching Stripe.
  const [placeResult, colorResult, unit_price_cents] = await Promise.all([
    place_slug
      ? supabase.from('places').select('id, name, status').eq('slug', place_slug).maybeSingle()
      : Promise.resolve({ data: null }),
    color_code
      ? supabase.from('colors').select('code').eq('code', color_code).maybeSingle()
      : Promise.resolve({ data: null }),
    item.custom_location
      ? getPersonalizedPrice(size_code)
      : calcUnitPriceCents({ size_code, frame_code, addons }),
  ]);

  if (place_slug && !placeResult.data) {
    throw new PricingError('invalid_place', `Unknown place_slug: ${place_slug}`);
  }
  if (place_slug && !SELLABLE_STATUSES.has(placeResult.data.status)) {
    throw new PricingError('not_available', `${place_slug} is not currently sellable (status: ${placeResult.data.status})`);
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
    qty: resolvedQty,
    custom_place: custom_place ?? null,
    custom_location: item.custom_location ?? null,
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
  if (gift_message && gift_message.length > FREE_TEXT_LIMITS.gift_message) {
    return sendError(res, 400, 'text_too_long', `gift_message exceeds ${FREE_TEXT_LIMITS.gift_message} characters`);
  }

  let priced;
  try {
    priced = await Promise.all(items.map(priceItem));
  } catch (err) {
    // PricingError is expected client-input rejection (bad size/frame/place) —
    // not logged, the 400 body already tells the caller what's wrong. An error
    // reaching here that ISN'T a PricingError means pricing itself broke
    // (Supabase down, bad addon config, etc.) — issue #59 needs that visible
    // in logs, since the 500 body alone gives no way to diagnose it after the fact.
    if (err instanceof PricingError) return sendError(res, 400, err.code, err.message);
    console.error('[checkout] pricing failed', err);
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
      // Handoff 8 ago 2026 sección 2 — el Aviso de Privacidad ya promete que
      // se recaba teléfono, y Ale lo necesita para coordinar el envío
      // manual. shipping_details no trae phone salvo que se pida así.
      phone_number_collection: { enabled: true },
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
