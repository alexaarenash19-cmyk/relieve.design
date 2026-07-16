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
  { code: 'nogal', label: 'Nogal' },
  { code: 'roble', label: 'Roble' },
  { code: 'negro', label: 'Negro' },
];

export const COLORS = [
  { code: 'blanco', label: 'Blanco', hex: '#FFFFFF' },
  { code: 'arena', label: 'Arena', hex: '#C2B280' },
  { code: 'grafito', label: 'Grafito', hex: '#4A4A4A' },
  { code: 'terracota', label: 'Terracota', hex: '#C1440E' },
];
