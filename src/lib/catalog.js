// ponytail: no GET /api/catalog exists in api.md, and these codes rarely
// change — mirroring the seed migration here beats adding an endpoint just
// to list four small static tables. If admin ever edits these live, add a
// GET /api/catalog and fetch instead.
//
// Public labels per Rayo X brief (jul 2026), sección 2 — reframe de eje de
// decisión de tamaño físico a contexto emocional/social de uso. `code`
// stays stable (DB/Stripe/CFDI/n8n key on it), only `label`/`tagline` are
// customer-facing. Dims are the REAL physical measurements Ale confirmed
// for the 5 wall pieces (20260727010001_catalog_cleanup_and_puzzle.sql) —
// 'grande' is still provisional, marked below.
export const WALL_SIZES = [
  { code: 'chico', label: 'Para ti', dims: '15x15 cm', tagline: 'La pieza para tu propio espacio — donde solo tú la ves cada día.' },
  { code: 'mediano', label: 'El que se cuenta', dims: '64x64 cm', featured: true, tagline: 'El tamaño que la gente ve primero al entrar a la sala — el más elegido para regalar.' },
  // PLACEHOLDER — Ale aún no confirma esta medida ("déjame pensar"), 80x80
  // cm es temporal mientras decide.
  { code: 'grande', label: 'Pieza de casa', dims: '80x80 cm', tagline: 'Presencia real de pared — la que ancla un espacio.' },
  { code: 'especial', label: 'La pieza ancla', dims: '120x80 cm', tagline: 'El statement — para el lugar que lo cambió todo.' },
];

// El puzzle (colección "Juego") tiene una sola medida real — no hay
// versiones chico/mediano/grande/especial de un puzzle.
export const PUZZLE_SIZES = [
  { code: 'puzzle', label: 'Único', dims: '20x20 cm', tagline: 'El tamaño real de esta pieza — un solo formato, para armar y jugar.' },
];

export const SIZES = [...WALL_SIZES, ...PUZZLE_SIZES];

// Product.jsx's single lookup point for "which size options apply to this
// place" — keeps the ciudad/juego branching in one place instead of
// repeated `place.type === 'juego' ? ... : ...` checks.
export function sizesForType(type) {
  return type === 'juego' ? PUZZLE_SIZES : WALL_SIZES;
}

// PLACEHOLDER — Ale to confirm real production/shipping timelines. One
// constant, not per-piece: every piece is made to order the same way.
export const PRODUCTION_DAYS = '10–15';
export const SHIPPING_DAYS = '3–5';

export const FRAMES = [
  { code: 'parota', label: 'Parota Nacional', hex: '#8A6844' }, // real product frame wood — replaces 'nogal' (never a real option; kept in DB only for existing order_items FK integrity)
  { code: 'roble', label: 'Roble', hex: '#B08D57' }, // real oak swatch, no brand token for it
  { code: 'negro', label: 'Negro', hex: '#232323' }, // --graphite (no pure black — ui-ux.md)
];

// terracota removed per Ale (contradicts the neutral-base brand standard:
// "el lugar es protagonista, no el color") — the `colors` DB row is kept
// for existing order_items FK integrity (same precedent as 'nogal' in
// FRAMES above), only dropped from this customer-facing list.
export const COLORS = [
  { code: 'blanco', label: 'Blanco', hex: '#F6F3ED' }, // --gallery-white (no pure white — ui-ux.md)
  { code: 'arena', label: 'Arena', hex: '#C2B280' }, // real sand-paint swatch, no brand token for it
  { code: 'grafito', label: 'Grafito', hex: '#232323' }, // --graphite
  { code: 'negromate', label: 'Negro mate', hex: '#1C1C1C' }, // real matte-black color option
];

// Issue #83 — "Cómo llega / cómo se cuelga" en 3 pasos (ui-ux.md, página de
// producto). PLACEHOLDER — Ale to confirm/rewrite the real packing/hanging
// process; wording kept deliberately general, no claimed hardware/materials
// this codebase has no source for (same spirit as the SIZES/PRODUCTION_DAYS
// placeholders above). Only applies to the wall pieces (colección Pared) —
// the puzzle doesn't hang, see PUZZLE_HOW_IT_ARRIVES_STEPS below.
export const HOW_IT_ARRIVES_STEPS = [
  { label: 'Empaque', detail: 'Sale de nuestro estudio embalada para viajar, lista para colgar al abrir la caja.' },
  { label: 'Instalación', detail: 'Se cuelga como cualquier cuadro — sin herrajes especiales.' },
  { label: 'Cuidado', detail: 'Acabado mate: se limpia con un paño seco, sin productos abrasivos.' },
];

// PLACEHOLDER — Ale to confirm/rewrite; the puzzle doesn't hang like the
// wall pieces (it doesn't meet the "cuelga sin herraje" standard, per
// Ale), so it needs its own 3 steps instead of reusing the ones above.
export const PUZZLE_HOW_IT_ARRIVES_STEPS = [
  { label: 'Empaque', detail: 'Sale de nuestro estudio embalado para viajar, listo para armar al abrir la caja.' },
  { label: 'Armado', detail: 'Se arma sobre cualquier superficie plana — sin herramientas ni pegamento.' },
  { label: 'Cuidado', detail: 'Acabado mate: se limpia con un paño seco, sin productos abrasivos.' },
];

// Sección 1 + 8 del brief Rayo X (jul 2026) — bloque de prueba social en el
// hero, oculto hasta que existan 3-5 reseñas reales de las piezas
// fundadoras. Flag a nivel de código (no hay infraestructura de config en
// vivo en este repo todavía) — cambiar a `true` y hacer deploy en cuanto
// lleguen las primeras reseñas.
export const SHOW_SOCIAL_PROOF = false;
