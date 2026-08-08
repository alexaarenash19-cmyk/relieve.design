// Single source of truth for place categories. Two independent taxonomies
// live here on purpose, not one — they answer different questions:
//
// `CATEGORIES` (`type`: ciudad/juego, "is this a framed wall piece or the
// puzzle?") — reused by the Explorar canvas's "tipo" filter chip,
// ProductPanel's category badge, and /coleccion/:slug.
//
// `SERIES` (`series`: origen/travesia/cumbre, the real `places.series`
// column — brand-brief.md sección 3 "Colecciones (Series)") — the brand's
// actual collection grouping, describing what the place IS (mexican city /
// foreign city / mountain), independent of how the piece is made. Used by
// /colecciones "por categoría" and /buscar's category filter.
export const CATEGORIES = [
  { value: 'ciudad', label: 'Ciudades' },
  { value: 'juego', label: 'Juego' },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const SERIES = [
  { value: 'origen', label: 'Serie Origen' },
  { value: 'travesia', label: 'Serie Travesía' },
  { value: 'cumbre', label: 'Serie Cumbre' },
];

export function seriesLabel(value) {
  return SERIES.find((s) => s.value === value)?.label ?? value;
}
