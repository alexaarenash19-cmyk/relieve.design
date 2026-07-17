// ponytail: no GET /api/catalog exists in api.md, and these codes rarely
// change — mirroring the seed migration here beats adding an endpoint just
// to list four small static tables. If admin ever edits these live, add a
// GET /api/catalog and fetch instead.
export const SIZES = [
  { code: 'chico', label: 'Chico', dims: '20x25 cm' },
  { code: 'mediano', label: 'Mediano', dims: '30x40 cm', featured: true },
  { code: 'grande', label: 'Grande', dims: '40x50 cm' },
  { code: 'especial', label: 'Especial', dims: '50x70 cm' },
];

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
