// Issue #24: GET /api/places/:slug
import { supabase } from '../_lib/supabase.js';
import { sendError } from '../_lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { slug } = req.query;

  const { data: place, error } = await supabase
    .from('places')
    .select(
      'id, slug, name, type, lat, lng, elevation_m, story, aerial_url, model_url, thumb_url, base_price_cents, status'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) return sendError(res, 500, 'db_error', error.message);
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
