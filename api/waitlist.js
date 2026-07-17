// Issue #37: POST /api/waitlist { place_slug, size_code, email } -> 201
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';

export default async function handler(req, res) {
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

  if (placeError) return sendError(res, 500, 'db_error', placeError.message);
  if (!place) return sendError(res, 400, 'invalid_place', `Unknown place_slug: ${place_slug}`);

  const { error } = await supabase
    .from('waitlist')
    .insert({ place_id: place.id, size_code, email });

  if (error) return sendError(res, 500, 'db_error', error.message);
  return res.status(201).json({ ok: true });
}
