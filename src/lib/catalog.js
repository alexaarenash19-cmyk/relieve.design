// ponytail: no GET /api/catalog exists in api.md, and these codes rarely
// change — mirroring the seed migration here beats adding an endpoint just
// to list four small static tables. If admin ever edits these live, add a
// GET /api/catalog and fetch instead.
//
// PLACEHOLDER labels — Ale will confirm/rename these; only `label` needs to
// change (`code` stays stable, it's what cart/pricing/orders key on), and
// changing it here updates every piece at once, nothing hardcoded per SKU.
export const SIZES = [
  { code: 'chico', label: 'Mini', dims: '20x25 cm' },
  { code: 'mediano', label: 'Mediano', dims: '30x40 cm', featured: true },
  { code: 'grande', label: 'Grande', dims: '40x50 cm' },
  { code: 'especial', label: 'King', dims: '50x70 cm' },
];

// PLACEHOLDER — Ale to confirm real production/shipping timelines. One
// constant, not per-piece: every piece is made to order the same way.
export const PRODUCTION_DAYS = '10–15';
export const SHIPPING_DAYS = '3–5';

export const FRAMES = [
  { code: 'nogal', label: 'Nogal', hex: '#7A5A43' }, // --walnut — ui-ux.md "marco de nogal"
  { code: 'roble', label: 'Roble', hex: '#B08D57' }, // real oak swatch, no brand token for it
  { code: 'negro', label: 'Negro', hex: '#232323' }, // --graphite (no pure black — ui-ux.md)
];

export const COLORS = [
  { code: 'blanco', label: 'Blanco', hex: '#F6F3ED' }, // --gallery-white (no pure white — ui-ux.md)
  { code: 'arena', label: 'Arena', hex: '#C2B280' }, // real sand-paint swatch, no brand token for it
  { code: 'grafito', label: 'Grafito', hex: '#232323' }, // --graphite
  { code: 'terracota', label: 'Terracota', hex: '#C1440E' }, // real terracotta-paint swatch, no brand token for it
];

// Issue #83 — "Cómo llega / cómo se cuelga" en 3 pasos (ui-ux.md, página de
// producto). PLACEHOLDER — Ale to confirm/rewrite the real packing/hanging
// process; wording kept deliberately general, no claimed hardware/materials
// this codebase has no source for (same spirit as the SIZES/PRODUCTION_DAYS
// placeholders above).
export const HOW_IT_ARRIVES_STEPS = [
  { label: 'Empaque', detail: 'Sale de nuestro estudio embalada para viajar, lista para colgar al abrir la caja.' },
  { label: 'Instalación', detail: 'Se cuelga como cualquier cuadro — sin herrajes especiales.' },
  { label: 'Cuidado', detail: 'Acabado mate: se limpia con un paño seco, sin productos abrasivos.' },
];
