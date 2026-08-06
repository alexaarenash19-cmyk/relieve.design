// Copy for the "Sobre Relieve" passport redesign. Revised 2026-08-06 (Phase 2
// of docs/relieve-brand-brief.md, §1) to swap ABOUT_COPY for the brief's
// approved brand-story copy (the "Hay una versión de mí que nunca volvió de
// Madrid..." story) — replaces the earlier cartography/fabrication-chain
// framing. Still pulled into its own module because it's stable regardless
// of the visual treatment.
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

export const ABOUT_COPY = `Hay una versión de mí que nunca volvió de Madrid.

No hablo de la ciudad — hablo de quién fui mientras la habité. De las tardes sin prisa que ya no tengo, de las calles que aprendí a reconocer de memoria, de la persona en la que me fui convirtiendo sin darme cuenta, solo por vivir ahí un tiempo.

Cuando volví, me costó explicar qué había cambiado. No tenía cómo mostrarlo. Una foto se queda guardada en el teléfono y ahí se olvida. Un recuerdo, con los años, se empieza a desdibujar. Necesitaba algo que pudiera tocar — algo que estuviera en mi casa todos los días, recordándome quién fui en ese lugar, aunque ya viviera una vida completamente distinta.

Así nació Relieve.

Empecé a crear piezas de las ciudades que me formaron — no souvenirs, sino algo que se pudiera sostener, con el peso y la textura de un lugar real.

Relieve existe para quien también tiene una ciudad así. La que te formó, la que amaste, la que sigues cargando contigo aunque hayan pasado los años y ya no vivas ahí. Esa ciudad merece un lugar en tu casa.`;

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