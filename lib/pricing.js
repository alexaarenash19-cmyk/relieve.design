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

  // Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #5 — un addon code que
  // no existe en catálogo simplemente no matcheaba ninguna fila y
  // contribuía $0 en silencio, en vez de rechazar la solicitud. No permite
  // bajar el precio de un addon real (los addons reales sí se suman bien),
  // pero es una validación incompleta: un typo o un code inventado debería
  // ser 400, no "gratis". Se revisa antes del catalogUnreachable branch
  // porque aplica a los dos caminos (real y dummy fallback) por igual.
  const uniqueAddons = [...new Set(addons)];

  if (catalogUnreachable) {
    if (!(size_code in DUMMY_SIZES)) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
    if (!(frame_code in DUMMY_FRAMES)) throw new PricingError('invalid_frame', `Unknown frame_code: ${frame_code}`);
    const unknownAddon = uniqueAddons.find((code) => !(code in DUMMY_ADDONS));
    if (unknownAddon) throw new PricingError('invalid_addon', `Unknown addon code: ${unknownAddon}`);
    return (
      DUMMY_SIZES[size_code] +
      DUMMY_FRAMES[frame_code] +
      addons.reduce((sum, code) => sum + DUMMY_ADDONS[code], 0)
    );
  }

  if (!size) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
  if (!frame) throw new PricingError('invalid_frame', `Unknown frame_code: ${frame_code}`);
  if (uniqueAddons.length && addonRows.length !== uniqueAddons.length) {
    throw new PricingError('invalid_addon', 'One or more addon codes are unknown');
  }

  return (
    size.price_cents +
    frame.price_delta_cents +
    addonRows.reduce((sum, a) => sum + a.price_delta_cents, 0)
  );
}

// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4.
// El 15% se calcula SOLO sobre sizes.price_cents — nunca sobre frame (siempre
// 'parota', sin delta) ni color (sin delta) para piezas personalizadas. Mismo
// patrón Supabase-primero/DUMMY_SIZES-fallback que calcUnitPriceCents arriba,
// reducido a un solo lookup porque la fórmula no necesita frame/addons.
export async function getPersonalizedPrice(size_code) {
  const { data: size, error } = await supabase
    .from('sizes')
    .select('price_cents')
    .eq('code', size_code)
    .maybeSingle();

  if (error) {
    if (!(size_code in DUMMY_SIZES)) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
    return Math.round(DUMMY_SIZES[size_code] * 1.15);
  }

  if (!size) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
  return Math.round(size.price_cents * 1.15);
}
