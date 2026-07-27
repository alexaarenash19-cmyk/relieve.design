// Single source of truth for place categories — reused by the experience
// view's "tipo" filter chip, /buscar's category filter, and the
// /colecciones "por categoría" view, so the taxonomy isn't duplicated in
// three places. `value` matches the `places.type` column.
// Real catalog is just Pared (ciudad) vs Juego — every other category
// (montaña/estadio/f1/méxico) was dev-phase filler with no real piece
// behind it and was removed from the catalog entirely.
export const CATEGORIES = [
  { value: 'ciudad', label: 'Ciudades' },
  { value: 'juego', label: 'Juego' },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
