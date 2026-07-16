// Issue #39: PATCH /api/admin/orders/:id — update status and/or tracking_number.
import { supabase } from '../../_lib/supabase.js';
import { sendError } from '../../_lib/errors.js';
import { requireAdmin } from '../../_lib/adminAuth.js';

const STATUSES = ['paid', 'in_production', 'shipped', 'delivered', 'cancelled'];

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return sendError(res, 405, 'method_not_allowed', 'Use PATCH');
  }
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  const { status, tracking_number } = req.body ?? {};

  if (status && !STATUSES.includes(status)) {
    return sendError(res, 400, 'invalid_status', `status must be one of ${STATUSES.join(', ')}`);
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
