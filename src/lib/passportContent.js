// Copy for the "Sobre Relieve" passport redesign. Revised 2026-07-23 to
// clarify product positioning, drop "hecho a mano" framing in favor of an
// explicit fabrication chain, and align with the site's cartography/
// architecture positioning (see PR for context). Still pulled into its own
// module because it's stable regardless of the visual treatment.
// All-Spanish per Ale's explicit call (first pass mirrored her brief's
// English field labels literally; she wants Spanish throughout instead).
export const PASSENGER_INFO = [
  ['Marca', 'Relieve'],
  ['Nacionalidad', 'Hecho en México'],
  ['Ocupación', 'Estudio de Diseño'],
  ['Especialización', 'Mapas topográficos y urbanos en relieve'],
  ['Fundación', '2026'],
  ['Misión', 'Transformar lugares en objetos que cuentan historias'],
  ['Medio', 'Cartografía · Diseño · Fabricación Digital'],
  ['Estado', 'Listo para Partir'],
];

export const ABOUT_COPY = `Relieve es un estudio de diseño especializado en cartografía contemporánea.

Diseñamos objetos tridimensionales inspirados en ciudades, paisajes y territorios que han marcado la vida de las personas.

Cada pieza comienza con una investigación cartográfica, continúa con un proceso de reconstrucción digital y termina con una fabricación cuidadosamente controlada: impresión 3D de alta precisión y acabado artesanal en nuestro estudio en México.

No buscamos reproducir un mapa. Buscamos representar la esencia de un lugar.

Relieve transforma información geográfica en objetos de diseño.`;

export const JOURNEY_STEPS = [
  { label: 'Origen', detail: 'Investigación y Selección del Lugar' },
  { label: 'Planeación de Ruta', detail: 'Reconstrucción y Modelado Digital' },
  { label: 'Tránsito', detail: 'Impresión 3D de Alta Precisión' },
  { label: 'Aduana', detail: 'Acabado, Ensamblaje y Enmarcado' },
  { label: 'Llegada', detail: 'Empaque y Envío a Tu Espacio' },
];

export const TRAVEL_ESSENTIALS = [
  'Cartografía de Precisión',
  'Fabricación Digital',
  'Diseño Contemporáneo',
  'Producción Local',
  'Acabados Premium',
];

export const LUGGAGE_STICKERS = [
  { title: 'Hecho en México', body: 'Diseñado y fabricado localmente.' },
  { title: 'Destino de Encargo', body: 'Creamos mapas hechos por encargo de lugares significativos.' },
  { title: 'Producción Limitada', body: 'Fabricamos bajo pedido para garantizar la calidad.' },
  { title: 'Diseño Topográfico', body: 'Inspirado en la cartografía y la arquitectura.' },
  { title: 'Recuerdos de Viaje', body: 'Cada pieza conserva la memoria de un lugar.' },
];

export const AUTHORIZED_DESTINATIONS = [
  'Ciudades',
  'Montañas',
  'Parques Nacionales',
  'Costas',
  'Islas',
  'Coordenadas de Encargo',
];

// Shape/tone/rotate per stamp so the visa page reads as 8 distinct stamps,
// not one shape repeated (per design refs — Clovis Retif / country visas).
// Tone sticks to navy/ink/walnut — sage measured too close in luminance to
// the cream background to read as legible "ink" once distressed. Shapes
// balanced 2x each across circle/oval/square/triangle per the refs
// (círculo, óvalo, rectángulo, triángulo — no todos la misma forma).
export const STAMP_PLACES = [
  { label: 'Ciudad de México', shape: 'circle', tone: 'navy', rotate: '-rotate-6' },
  { label: 'Tokio', shape: 'square', tone: 'walnut', rotate: 'rotate-3' },
  { label: 'París', shape: 'triangle', tone: 'ink', rotate: '-rotate-3' },
  { label: 'Nueva York', shape: 'oval', tone: 'walnut', rotate: 'rotate-6' },
  { label: 'Patagonia', shape: 'square', tone: 'ink', rotate: '-rotate-2' },
  { label: 'Dolomitas', shape: 'circle', tone: 'walnut', rotate: 'rotate-4' },
  { label: 'Islandia', shape: 'triangle', tone: 'navy', rotate: 'rotate-2' },
  { label: 'Alpes', shape: 'oval', tone: 'ink', rotate: '-rotate-4' },
];
