// Issue #36: GET /api/orders/:token — magic-link order status, no login.
import { supabase } from '../../lib/supabase.js';
import { sendError } from '../../lib/errors.js';

export default async function handler(req, res) {
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
