import { supabase } from './supabase.js';
import { DUMMY_SIZES, DUMMY_FRAMES, DUMMY_ADDONS } from './dummyCatalog.js';

export class PricingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// unit_price_cents = sizes.price_cents + frames.price_delta_cents + Σ addons.price_delta_cents
// PLACEHOLDER fallback: if the catalog tables aren't reachable (no Supabase
// connected yet), price from the hardcoded dummyCatalog mirror instead of
// treating "the DB is down" as "the user picked an invalid size" — that was
// the actual bug behind the reported 500s. Real data takes over the moment
// the queries start succeeding; nothing to flip off by hand.
export async function calcUnitPriceCents({ size_code, frame_code, addons = [] }) {
  const [{ data: size, error: sizeErr }, { data: frame, error: frameErr }, { data: addonRows, error: addonsErr }] =
    await Promise.all([
      supabase.from('sizes').select('price_cents').eq('code', size_code).maybeSingle(),
      supabase.from('frames').select('price_delta_cents').eq('code', frame_code).maybeSingle(),
      addons.length
        ? supabase.from('addons').select('price_delta_cents').in('code', addons)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const catalogUnreachable = sizeErr || frameErr || addonsErr;

  if (catalogUnreachable) {
    if (!(size_code in DUMMY_SIZES)) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
    if (!(frame_code in DUMMY_FRAMES)) throw new PricingError('invalid_frame', `Unknown frame_code: ${frame_code}`);
    return (
      DUMMY_SIZES[size_code] +
      DUMMY_FRAMES[frame_code] +
      addons.reduce((sum, code) => sum + (DUMMY_ADDONS[code] ?? 0), 0)
    );
  }

  if (!size) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
  if (!frame) throw new PricingError('invalid_frame', `Unknown frame_code: ${frame_code}`);

  return (
    size.price_cents +
    frame.price_delta_cents +
    addonRows.reduce((sum, a) => sum + a.price_delta_cents, 0)
  );
}
