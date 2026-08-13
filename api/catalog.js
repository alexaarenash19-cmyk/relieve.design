// Consolidated storefront-read/write endpoints — places, pricing, waitlist,
// curva_de_nivel, order status — merged into one function so the Vercel Hobby plan's
// 12-function cap has real margin. Same URLs, same behavior: vercel.json
// rewrites each original path here with a `resource` query param. Kept
// separate from checkout/reviews/webhooks/admin because those need either
// bodyParser:false (multipart, raw signature bytes) or extra auth/critical-
// path isolation — merging those in would change behavior, not just
// organization.
//
// PLACEHOLDER fallback: when Supabase isn't reachable (no catalog connected
// yet — the reported 500s), places/waitlist fall back to
// ../lib/dummyCatalog.js instead of erroring, so the site is fully
// browsable/testable today. Real data silently takes over the moment the
// queries start succeeding — nothing to flip off by hand.
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';
import { calcUnitPriceCents, PricingError } from '../lib/pricing.js';
import { DUMMY_PLACES, findDummyPlace } from '../lib/dummyCatalog.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { sendCurvaDeNivelWelcome, sendAlert } from '../lib/alerts.js';

// Issue #23/#24: GET /api/places?q=&type=&series= and GET /api/places/:slug
// `type` (ciudad/juego, wall piece vs. puzzle) and `series` (origen/
// travesia/cumbre, src/lib/categories.js SERIES) are independent columns —
// see 20260806020001_add_places_series.sql for why series can't be derived
// from type. `series` added for /coleccion/:slug and /colecciones' "por
// categoría" view (handoff 8 ago 2026 sección 1), mirroring the existing
// `type` filter rather than a new endpoint.
async function getPlaces(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { slug } = req.query;
  if (slug) return getPlaceDetail(req, res, slug);

  const { q, type, series } = req.query;

  let query = supabase
    .from('places')
    .select('slug, name, type, series, thumb_url, base_price_cents, status')
    // 'draft' is how a place gets archived when it can't be hard-deleted
    // (existing order_items/reviews/waitlist reference it — see
    // 20260727010001_catalog_cleanup_and_puzzle.sql) — it must never
    // surface in the public catalog.
    .neq('status', 'draft');

  if (q) query = query.ilike('name', `%${q}%`);
  if (type) query = query.eq('type', type);
  if (series) query = query.eq('series', series);

  const { data, error } = await query.order('name');

  if (error) {
    res.setHeader('Cache-Control', 'no-store');
    const places = DUMMY_PLACES.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
        (!type || p.type === type) &&
        (!series || p.series === series),
    ).map(
      ({
        id,
        aerial_url,
        model_url,
        lat,
        lng,
        elevation_m,
        story,
        base_price_cents,
        ...p
      }) => ({
        ...p,
        base_price: base_price_cents,
      }),
    );
    return res.status(200).json(places);
  }

  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  );
  const places = data.map(({ base_price_cents, ...p }) => ({
    ...p,
    base_price: base_price_cents,
  }));
  return res.status(200).json(places);
}

async function getPlaceDetail(req, res, slug) {
  const { data: place, error } = await supabase
    .from('places')
    .select(
      // country added for FichaTecnica.jsx (brand-brief.md sección 6/10) —
      // was already a real column (default 'MX', 20260716120001) but never
      // selected here since nothing needed it before.
      'id, slug, name, type, series, country, lat, lng, elevation_m, story, aerial_url, model_url, thumb_url, base_price_cents, status',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    res.setHeader('Cache-Control', 'no-store');
    const dummy = findDummyPlace(slug);
    if (!dummy) return sendError(res, 404, 'not_found', 'Place not found');
    const { id, base_price_cents, ...rest } = dummy;
    return res
      .status(200)
      .json({ ...rest, base_price: base_price_cents, reviews_count: 0 });
  }

  if (!place) {
    res.setHeader('Cache-Control', 'no-store');
    return sendError(res, 404, 'not_found', 'Place not found');
  }

  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('approved', true)
    .eq('place_id', place.id);

  const { id, base_price_cents, ...rest } = place;
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  );
  return res.status(200).json({
    ...rest,
    base_price: base_price_cents,
    reviews_count: count ?? 0,
  });
}

// Issue #25: POST /api/pricing
async function postPricing(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  const { size_code, frame_code, addons = [] } = req.body ?? {};
  if (!size_code || !frame_code) {
    return sendError(
      res,
      400,
      'invalid_request',
      'size_code and frame_code are required',
    );
  }

  try {
    const unit_price = await calcUnitPriceCents({
      size_code,
      frame_code,
      addons,
    });
    return res.status(200).json({ unit_price });
  } catch (err) {
    if (err instanceof PricingError)
      return sendError(res, 400, err.code, err.message);
    return sendError(res, 500, 'db_error', err.message);
  }
}

// Issue #37: POST /api/waitlist { place_slug, size_code, email } -> 201
async function postWaitlist(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  if (!(await checkRateLimit(req, res, { key: 'waitlist', limit: 5, windowMs: 60_000 }))) return;

  const { place_slug, size_code, email } = req.body ?? {};
  if (!place_slug || !email) {
    return sendError(
      res,
      400,
      'invalid_request',
      'place_slug and email are required',
    );
  }

  const { data: place, error: placeError } = await supabase
    .from('places')
    .select('id')
    .eq('slug', place_slug)
    .maybeSingle();

  if (placeError) {
    // Catalog unreachable — accept the signup against the dummy place so the
    // soldout/waitlist flow is still testable; nothing is actually persisted
    // for a dummy slug since there's no real DB to write to.
    if (findDummyPlace(place_slug)) return res.status(201).json({ ok: true });
    return sendError(res, 500, 'db_error', placeError.message);
  }
  if (!place)
    return sendError(
      res,
      400,
      'invalid_place',
      `Unknown place_slug: ${place_slug}`,
    );

  const { error } = await supabase
    .from('waitlist')
    .insert({ place_id: place.id, size_code, email });

  if (error) return sendError(res, 500, 'db_error', error.message);
  return res.status(201).json({ ok: true });
}

// brand-brief.md §16 decisión 9: POST /api/curva-de-nivel { email } -> 201.
// A nivel sitio, no por pieza (a diferencia de waitlist) — sin place_id.
// Mismas convenciones de validación/rate-limit que postWaitlist arriba y
// api/reviews.js. Un email duplicado no es un error del cliente — la
// constraint `unique` en la tabla ya lo deduplica en silencio (23505 =
// unique_violation), así que un reintento/doble-click sigue devolviendo
// 201 en vez de un 500 confuso.
async function postCurvaDeNivel(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  if (!(await checkRateLimit(req, res, { key: 'curva-de-nivel', limit: 5, windowMs: 60_000 }))) return;

  const { email } = req.body ?? {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return sendError(res, 400, 'invalid_request', 'A valid email is required');
  }

  const trimmedEmail = email.trim().toLowerCase();
  const { error } = await supabase.from('curva_de_nivel').insert({ email: trimmedEmail });

  if (error && error.code !== '23505') {
    return sendError(res, 500, 'db_error', error.message);
  }

  // Fire-and-forget, same reasoning as the checkout-attempt capture in
  // api/checkout.js: this is a "type an email, click a button" interaction
  // that should stay snappy — an extra Resend round-trip on the critical
  // path buys the customer nothing. A failure here doesn't mean the
  // signup failed (the insert above already succeeded/deduped), so it's
  // reported via sendAlert instead of failing the request.
  sendCurvaDeNivelWelcome(trimmedEmail).catch((err) => {
    console.error('[curva-de-nivel] welcome email failed', err);
    sendAlert('curva-de-nivel welcome email failed', `${trimmedEmail}: ${err.stack ?? err.message}`);
  });

  return res.status(201).json({ ok: true });
}

// Issue #36: GET /api/orders/:token — magic-link order status, no login.
async function getOrder(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { token } = req.query;

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, number, status, tracking_number, created_at')
    .eq('status_token', token)
    .maybeSingle();

  if (error) return sendError(res, 500, 'db_error', error.message);
  if (!order) return sendError(res, 404, 'not_found', 'Order not found');

  // brand-brief.md §16 decisión (numeración de pieza, 8 ago 2026): piece_number
  // se asigna por default de columna (nextval de piece_number_seq) en el
  // momento en que se crea el order_item — es decir, solo en pedidos ya
  // pagados (checkout.session.completed en api/webhooks/stripe.js es el
  // único lugar que inserta en order_items). No requirió tocar el webhook.
  // "edición N.º" y "pieza N.º" son el mismo número (misma secuencia global),
  // por eso FichaTecnica recibe piece_number para ambos props.
  // places(...) embebe el lugar vía la FK place_id -> places.id, para no
  // hacer una consulta aparte por cada item en el frontend.
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(
      'place_id, custom_place, size_code, frame_code, color_code, qty, unit_price_cents, piece_number, places(name, series, country, type)',
    )
    .eq('order_id', order.id);

  if (itemsError) return sendError(res, 500, 'db_error', itemsError.message);

  const { id, ...rest } = order;
  return res.status(200).json({ ...rest, items });
}

// Bridges Stripe's success_url (?session_id=...) to the magic-link token —
// the browser lands here right after payment, before the webhook is
// guaranteed to have created the order yet, so 404 is an expected transient
// state the frontend polls through, not an error condition on its own.
async function getOrderBySession(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { session_id } = req.query;
  if (!session_id) {
    return sendError(res, 400, 'invalid_request', 'session_id is required');
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('status_token')
    .eq('stripe_session_id', session_id)
    .maybeSingle();

  if (error) return sendError(res, 500, 'db_error', error.message);
  if (!order) return sendError(res, 404, 'not_found', 'Order not created yet');
  return res.status(200).json({ status_token: order.status_token });
}

const RESOURCES = {
  places: getPlaces,
  pricing: postPricing,
  waitlist: postWaitlist,
  curva_de_nivel: postCurvaDeNivel,
  orders: getOrder,
  orders_by_session: getOrderBySession,
};

export default async function handler(req, res) {
  const fn = RESOURCES[req.query.resource];
  if (!fn) return sendError(res, 404, 'not_found', 'Unknown resource');
  return fn(req, res);
}
