// Issue #25: POST /api/pricing
// unit_price = sizes.price_cents + frames.price_delta_cents + Σ addons.price_delta_cents
import { supabase } from './_lib/supabase.js';
import { sendError } from './_lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  const { size_code, frame_code, addons = [] } = req.body ?? {};
  if (!size_code || !frame_code) {
    return sendError(res, 400, 'invalid_request', 'size_code and frame_code are required');
  }

  const [{ data: size }, { data: frame }, { data: addonRows }] = await Promise.all([
    supabase.from('sizes').select('price_cents').eq('code', size_code).maybeSingle(),
    supabase.from('frames').select('price_delta_cents').eq('code', frame_code).maybeSingle(),
    addons.length
      ? supabase.from('addons').select('price_delta_cents').in('code', addons)
      : Promise.resolve({ data: [] }),
  ]);

  if (!size) return sendError(res, 400, 'invalid_size', `Unknown size_code: ${size_code}`);
  if (!frame) return sendError(res, 400, 'invalid_frame', `Unknown frame_code: ${frame_code}`);

  const unit_price = (
    size.price_cents +
    frame.price_delta_cents +
    addonRows.reduce((sum, a) => sum + a.price_delta_cents, 0)
  );

  return res.status(200).json({ unit_price });
}
