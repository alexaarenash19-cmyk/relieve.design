// ponytail: no GET /api/catalog exists in api.md, and these codes rarely
// change — mirroring the seed migration here beats adding an endpoint just
// to list four small static tables. If admin ever edits these live, add a
// GET /api/catalog and fetch instead.
//
// Public labels per Rayo X brief (jul 2026), sección 2 — reframe de eje de
// decisión de tamaño físico a contexto emocional/social de uso. `code`
// stays stable (DB/Stripe/CFDI/n8n key on it), only `label`/`tagline` are
// customer-facing.
export const SIZES = [
  { code: 'chico', label: 'Para ti', dims: '20x25 cm', tagline: 'La pieza para tu propio espacio — donde solo tú la ves cada día.' },
  { code: 'mediano', label: 'El que se cuenta', dims: '30x40 cm', featured: true, tagline: 'El tamaño que la gente ve primero al entrar a la sala — el más elegido para regalar.' },
  { code: 'grande', label: 'Pieza de casa', dims: '40x50 cm', tagline: 'Presencia real de pared — la que ancla un espacio.' },
  { code: 'especial', label: 'La pieza ancla', dims: '50x70 cm', tagline: 'El statement — para el lugar que lo cambió todo.' },
];

// PLACEHOLDER — Ale to confirm real production/shipping timelines. One
// constant, not per-piece: every piece is made to order the same way.
export const PRODUCTION_DAYS = '10–15';
export const SHIPPING_DAYS = '3–5';

export const FRAMES = [
  { code: 'parota', label: 'Parota Nacional', hex: '#8A6844' }, // real product frame wood — replaces 'nogal' (never a real option; kept in DB only for existing order_items FK integrity)
  { code: 'roble', label: 'Roble', hex: '#B08D57' }, // real oak swatch, no brand token for it
  { code: 'negro', label: 'Negro', hex: '#232323' }, // --graphite (no pure black — ui-ux.md)
];

export const COLORS = [
  { code: 'blanco', label: 'Blanco', hex: '#F6F3ED' }, // --gallery-white (no pure white — ui-ux.md)
  { code: 'arena', label: 'Arena', hex: '#C2B280' }, // real sand-paint swatch, no brand token for it
  { code: 'grafito', label: 'Grafito', hex: '#232323' }, // --graphite
  { code: 'terracota', label: 'Terracota', hex: '#C1440E' }, // real terracotta-paint swatch, no brand token for it
  { code: 'negromate', label: 'Negro mate', hex: '#1C1C1C' }, // real matte-black color option
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

// Sección 1 + 8 del brief Rayo X (jul 2026) — bloque de prueba social en el
// hero, oculto hasta que existan 3-5 reseñas reales de las piezas
// fundadoras. Flag a nivel de código (no hay infraestructura de config en
// vivo en este repo todavía) — cambiar a `true` y hacer deploy en cuanto
// lleguen las primeras reseñas.
export const SHOW_SOCIAL_PROOF = false;
