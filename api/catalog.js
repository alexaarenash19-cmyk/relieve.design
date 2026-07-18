// Consolidated storefront-read/write endpoints — places, pricing, waitlist,
// order status — merged into one function so the Vercel Hobby plan's
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

// Issue #23/#24: GET /api/places?q=&type= and GET /api/places/:slug
// `type` doubles as the category (src/lib/categories.js) — the collections
// table/endpoint was a separate taxonomy for the same grouping and was
// removed rather than kept in parallel.
async function getPlaces(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { slug } = req.query;
  if (slug) return getPlaceDetail(req, res, slug);

  const { q, type } = req.query;

  let query = supabase
    .from('places')
    .select('slug, name, type, thumb_url, base_price_cents, status');

  if (q) query = query.ilike('name', `%${q}%`);
  if (type) query = query.eq('type', type);

  const { data, error } = await query.order('name');

  if (error) {
    const places = DUMMY_PLACES.filter(
      (p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!type || p.type === type)
    ).map(({ id, aerial_url, model_url, lat, lng, elevation_m, story, base_price_cents, ...p }) => ({
      ...p,
      base_price: base_price_cents,
    }));
    return res.status(200).json(places);
  }

  const places = data.map(({ base_price_cents, ...p }) => ({ ...p, base_price: base_price_cents }));
  return res.status(200).json(places);
}

async function getPlaceDetail(req, res, slug) {
  const { data: place, error } = await supabase
    .from('places')
    .select(
      'id, slug, name, type, lat, lng, elevation_m, story, aerial_url, model_url, thumb_url, base_price_cents, status'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    const dummy = findDummyPlace(slug);
    if (!dummy) return sendError(res, 404, 'not_found', 'Place not found');
    const { id, base_price_cents, ...rest } = dummy;
    return res.status(200).json({ ...rest, base_price: base_price_cents, reviews_count: 0 });
  }

  if (!place) return sendError(res, 404, 'not_found', 'Place not found');

  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('approved', true)
    .eq('place_id', place.id);

  const { id, base_price_cents, ...rest } = place;
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
    return sendError(res, 400, 'invalid_request', 'size_code and frame_code are required');
  }

  try {
    const unit_price = await calcUnitPriceCents({ size_code, frame_code, addons });
    return res.status(200).json({ unit_price });
  } catch (err) {
    if (err instanceof PricingError) return sendError(res, 400, err.code, err.message);
    return sendError(res, 500, 'db_error', err.message);
  }
}

// Issue #37: POST /api/waitlist { place_slug, size_code, email } -> 201
async function postWaitlist(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  const { place_slug, size_code, email } = req.body ?? {};
  if (!place_slug || !email) {
    return sendError(res, 400, 'invalid_request', 'place_slug and email are required');
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
  if (!place) return sendError(res, 400, 'invalid_place', `Unknown place_slug: ${place_slug}`);

  const { error } = await supabase
    .from('waitlist')
    .insert({ place_id: place.id, size_code, email });

  if (error) return sendError(res, 500, 'db_error', error.message);
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

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('place_id, custom_place, size_code, frame_code, color_code, qty, unit_price_cents')
    .eq('order_id', order.id);

  if (itemsError) return sendError(res, 500, 'db_error', itemsError.message);

  const { id, ...rest } = order;
  return res.status(200).json({ ...rest, items });
}

const RESOURCES = {
  places: getPlaces,
  pricing: postPricing,
  waitlist: postWaitlist,
  orders: getOrder,
};

export default async function handler(req, res) {
  const fn = RESOURCES[req.query.resource];
  if (!fn) return sendError(res, 404, 'not_found', 'Unknown resource');
  return fn(req, res);
}
