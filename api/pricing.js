// Issue #25: POST /api/pricing
import { sendError } from './_lib/errors.js';
import { calcUnitPriceCents, PricingError } from './_lib/pricing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  const { size_code, frame_code, addons = [] } = req.body ?? {};
  if (!size_code || !frame_code) {
    return sendError(res, 400, 'invalid_request', 'size_code and frame_code are required');
  }

  try {
    const unit_price = await calcUnitPriceCents({ size_code, frame_code, addons });
    return res.status(200).json({ unit_price });
  } catch (err) {
    if (err instanceof PricingError) return sendError(res, 400, err.code, err.message);
    return sendError(res, 500, 'db_error', err.message);
  }
}
