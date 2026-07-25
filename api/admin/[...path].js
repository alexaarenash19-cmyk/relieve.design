// Issue #39, consolidated: PATCH /api/admin/orders/:id, PATCH /api/admin/reviews/:id,
// and POST /api/admin/places all route through this one catch-all function.
// Merged so the Vercel Hobby plan's 12-function cap has room (was 3 files, now 1) —
// same URLs, same behavior, nothing removed.
import { supabase } from '../../lib/supabase.js';
import { sendError } from '../../lib/errors.js';
import { requireAdmin } from '../../lib/adminAuth.js';

const ORDER_STATUSES = ['paid', 'in_production', 'shipped', 'delivered', 'cancelled'];

async function patchOrder(req, res, id) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return sendError(res, 405, 'method_not_allowed', 'Use PATCH');
  }

  const { status, tracking_number } = req.body ?? {};
  if (status && !ORDER_STATUSES.includes(status)) {
    return sendError(res, 400, 'invalid_status', `status must be one of ${ORDER_STATUSES.join(', ')}`);
  }

  const updates = {};
  if (status) updates.status = status;
  if (tracking_number) updates.tracking_number = tracking_number;
  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'invalid_request', 'Provide status and/or tracking_number');
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select('id, number, status, tracking_number')
    .maybeSingle();

  if (error) return sendError(res, 500, 'db_error', error.message);
  if (!data) return sendError(res, 404, 'not_found', 'Order not found');
  return res.status(200).json(data);
}

async function patchReview(req, res, id) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return sendError(res, 405, 'method_not_allowed', 'Use PATCH');
  }

  const { approved = true } = req.body ?? {};
  const { data, error } = await supabase
    .from('reviews')
    .update({ approved })
    .eq('id', id)
    .select('id, approved')
    .maybeSingle();

  if (error) return sendError(res, 500, 'db_error', error.message);
  if (!data) return sendError(res, 404, 'not_found', 'Review not found');
  return res.status(200).json(data);
}

async function postPlace(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  const {
    collection_id, slug, name, type, country, lat, lng,
    elevation_m, story, aerial_url, model_url, thumb_url,
    base_price_cents, status,
  } = req.body ?? {};

  if (!slug || !name || !type || !base_price_cents) {
    return sendError(
      res, 400, 'invalid_request',
      'slug, name, type, and base_price_cents are required'
    );
  }

  const { data, error } = await supabase
    .from('places')
    .insert({
      collection_id, slug, name, type, country, lat, lng,
      elevation_m, story, aerial_url, model_url, thumb_url,
      base_price_cents, status,
    })
    .select()
    .single();

  if (error) return sendError(res, 500, 'db_error', error.message);
  return res.status(201).json(data);
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

  const [resource, id] = req.query.path ?? [];

  if (resource === 'orders' && id) return patchOrder(req, res, id);
  if (resource === 'reviews' && id) return patchReview(req, res, id);
  if (resource === 'places' && !id) return postPlace(req, res);

  return sendError(res, 404, 'not_found', 'Unknown admin route');
}
