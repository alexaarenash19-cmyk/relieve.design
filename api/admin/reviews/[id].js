// Issue #39: PATCH /api/admin/reviews/:id — approve a review.
import { supabase } from '../../_lib/supabase.js';
import { sendError } from '../../_lib/errors.js';
import { requireAdmin } from '../../_lib/adminAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return sendError(res, 405, 'method_not_allowed', 'Use PATCH');
  }
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
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
