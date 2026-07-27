// Single source of truth for place categories — reused by the experience
// view's "tipo" filter chip, /buscar's category filter, and the
// /colecciones "por categoría" view, so the taxonomy isn't duplicated in
// three places. `value` matches the `places.type` column WHERE a real
// piece exists for it — 'montana', 'mexico' and 'f1' below have no real
// piece behind them yet (see docs/superpowers/specs/2026-07-26-explorar-
// colecciones-design.md) and are placeholder filter options only: they
// render as a chip but currently always return an empty result set. Once
// Ale runs the pending migration (add_mexico_type_and_reclassify_cdmx.sql)
// 'mexico' starts matching Ciudad de México for real, with no code change
// needed here.
export const CATEGORIES = [
  { value: 'ciudad', label: 'Ciudad' },
  { value: 'mexico', label: 'Mexico' },
  { value: 'montana', label: 'Relieve (Montaña)' },
  { value: 'f1', label: 'Pistas F1' },
  // Same DB value as before ('juego') — only the customer-facing label
  // changed, per the Explorar spec's filter wording. The `collections`
  // table's own 'Juego' row is untouched (vestigial, unused by the
  // frontend — see api/catalog.js's comment).
  { value: 'juego', label: 'Puzzle' },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
