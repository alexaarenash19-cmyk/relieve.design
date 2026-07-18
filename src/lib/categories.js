// Single source of truth for place categories — reused by the experience
// view's "tipo" filter chip, /buscar's category filter, and the
// /colecciones "por categoría" view, so the taxonomy isn't duplicated in
// three places. `value` matches the `places.type` column.
// Alphabetical by label: Ciudades, Estadios, F1, México, Montaña.
export const CATEGORIES = [
  { value: 'ciudad', label: 'Ciudades' },
  { value: 'estadio', label: 'Estadios' },
  { value: 'f1', label: 'F1' },
  { value: 'mexico', label: 'México' },
  { value: 'montana', label: 'Montaña' },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
