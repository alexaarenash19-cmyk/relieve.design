import { supabase } from './supabase.js';

export class PricingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// unit_price_cents = sizes.price_cents + frames.price_delta_cents + Σ addons.price_delta_cents
export async function calcUnitPriceCents({ size_code, frame_code, addons = [] }) {
  const [{ data: size }, { data: frame }, { data: addonRows }] = await Promise.all([
    supabase.from('sizes').select('price_cents').eq('code', size_code).maybeSingle(),
    supabase.from('frames').select('price_delta_cents').eq('code', frame_code).maybeSingle(),
    addons.length
      ? supabase.from('addons').select('price_delta_cents').in('code', addons)
      : Promise.resolve({ data: [] }),
  ]);

  if (!size) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
  if (!frame) throw new PricingError('invalid_frame', `Unknown frame_code: ${frame_code}`);

  return (
    size.price_cents +
    frame.price_delta_cents +
    addonRows.reduce((sum, a) => sum + a.price_delta_cents, 0)
  );
}
