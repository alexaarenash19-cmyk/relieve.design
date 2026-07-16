// Issue #39: POST /api/admin/places — create a place (alta de lugares/modelos).
import { supabase } from '../_lib/supabase.js';
import { sendError } from '../_lib/errors.js';
import { requireAdmin } from '../_lib/adminAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }
  if (!requireAdmin(req, res)) return;

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
