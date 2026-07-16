// Issues #23: GET /api/places?q=&collection=&type=
import { supabase } from '../_lib/supabase.js';
import { sendError } from '../_lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { q, collection, type } = req.query;

  let query = supabase
    .from('places')
    .select('slug, name, type, thumb_url, base_price_cents, status, collections(slug)');

  if (q) query = query.ilike('name', `%${q}%`);
  if (type) query = query.eq('type', type);

  const { data, error } = await query.order('name');
  if (error) return sendError(res, 500, 'db_error', error.message);

  const places = data
    .filter((p) => !collection || p.collections?.slug === collection)
    .map(({ collections, base_price_cents, ...p }) => ({
      ...p,
      base_price: base_price_cents,
    }));

  return res.status(200).json(places);
}
