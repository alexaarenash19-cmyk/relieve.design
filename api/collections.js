// Issue #22: GET /api/collections
import { supabase } from '../lib/supabase.js';
import { sendError } from '../lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'method_not_allowed', 'Use GET');
  }

  const { data, error } = await supabase
    .from('collections')
    .select('id, slug, name, photo_url')
    .eq('active', true)
    .order('sort');

  if (error) return sendError(res, 500, 'db_error', error.message);
  return res.status(200).json(data);
}
