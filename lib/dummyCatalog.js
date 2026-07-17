// PLACEHOLDER — served by api/catalog.js only when the real Supabase query
// fails (no catalog connected yet), so /buscar, the gallery, and
// /pieza/:slug are fully testable today. Once Supabase has real data the
// queries succeed and this file stops being reached — nothing to flip off
// by hand. Slugs match the real seed migration (supabase/migrations/
// 20260716130002_seed_places.sql) so nothing breaks when real data lands.
const img = (id) => `https://images.unsplash.com/photo-${id}?fm=jpg&q=70&w=1200&auto=format&fit=crop`;

export const DUMMY_COLLECTION = { id: 1, slug: 'ciudades-mexico', name: 'Ciudades de México', photo_url: null };

export const DUMMY_PLACES = [
  {
    id: 1001,
    slug: 'monterrey',
    name: 'Monterrey',
    type: 'ciudad',
    lat: 25.686613,
    lng: -100.316116,
    elevation_m: null,
    story: 'Rodeada por la Sierra Madre Oriental, la silueta de Monterrey mezcla el trazo industrial del norte con el filo del Cerro de la Silla al fondo.',
    aerial_url: null,
    model_url: null,
    thumb_url: img('1642321215251-bd9999b0b408'),
    base_price_cents: 129900,
    status: 'active',
    collection: 'ciudades-mexico',
  },
  {
    id: 1002,
    slug: 'ciudad-de-mexico',
    name: 'Ciudad de México',
    type: 'ciudad',
    lat: 19.432608,
    lng: -99.133209,
    elevation_m: null,
    story: 'El Zócalo, la traza reticular del centro y el Ángel a lo lejos: la Ciudad de México en relieve es, sobre todo, una cuenca llena de calles.',
    aerial_url: null,
    model_url: null,
    thumb_url: img('1591049433264-618fa2f4558f'),
    base_price_cents: 129900,
    status: 'active',
    collection: 'ciudades-mexico',
  },
  {
    id: 1003,
    slug: 'popocatepetl',
    name: 'Popocatépetl',
    type: 'montana',
    lat: 19.023056,
    lng: -98.622778,
    elevation_m: 5426,
    story: 'El Popocatépetl se eleva 5,426 msnm sobre el Valle de México y Puebla — un volcán activo, no una montaña cualquiera.',
    aerial_url: null,
    model_url: null,
    thumb_url: img('1562196531-60920785b7ca'),
    base_price_cents: 129900,
    status: 'active',
    collection: 'ciudades-mexico',
  },
  {
    id: 1004,
    slug: 'oaxaca',
    name: 'Oaxaca',
    type: 'ciudad',
    lat: 17.073185,
    lng: -96.72656,
    elevation_m: null,
    story: 'Oaxaca de Juárez ocupa un valle rodeado de sierras; el relieve marca la diferencia entre el centro plano y las laderas donde empieza la montaña.',
    aerial_url: null,
    model_url: null,
    thumb_url: img('1641511256207-3e3ced99393e'),
    base_price_cents: 129900,
    status: 'active',
    collection: 'ciudades-mexico',
  },
  {
    id: 1005,
    slug: 'san-miguel-de-allende',
    name: 'San Miguel de Allende',
    type: 'ciudad',
    lat: 20.914042,
    lng: -100.744461,
    elevation_m: null,
    story: 'San Miguel de Allende sube y baja por calles empedradas sobre un cerro; en relieve se nota por qué caminar ahí cansa más de lo que parece.',
    aerial_url: null,
    model_url: null,
    thumb_url: img('1598535989263-cb097f8ac3f0'),
    base_price_cents: 129900,
    status: 'active',
    collection: 'ciudades-mexico',
  },
];

export function findDummyPlace(slug) {
  return DUMMY_PLACES.find((p) => p.slug === slug) ?? null;
}

// Mirrors supabase/migrations/20260716130001_seed_catalog.sql — used as a
// pricing fallback (lib/pricing.js) when the sizes/frames/addons tables
// aren't reachable either.
export const DUMMY_SIZES = {
  chico: 99900,
  mediano: 129900,
  grande: 169900,
  especial: 249900,
};
export const DUMMY_FRAMES = {
  nogal: 0,
  roble: 20000,
  negro: 0,
};
export const DUMMY_ADDONS = {
  capelo: 35000,
  placa: 15000,
};

// PLACEHOLDER — served by api/reviews.js when Supabase is unreachable or the
// place has no real DB row (a dummy slug), so the click-to-reveal-photo
// interaction is testable before real reviews exist. Real reviews take over
// silently once Supabase has data for a place — nothing to flip off by hand.
export const DUMMY_REVIEWS = [
  {
    place_slug: 'monterrey',
    customer: 'Diana R.',
    city: 'Monterrey, NL',
    rating: 5,
    comment: 'Quedó exacto donde lo imaginé, arriba del librero de la sala. Se nota el Cerro de la Silla en el relieve.',
    photo_url: 'https://images.unsplash.com/photo-1769117549887-d7ab37279060?fm=jpg&q=70&w=1200&auto=format&fit=crop',
  },
  {
    place_slug: 'popocatepetl',
    customer: 'Jorge M.',
    city: 'Puebla, PUE',
    rating: 5,
    comment: 'Se lo regalé a mi papá, alpinista retirado. Lloró un poco, está colgado en su estudio.',
    photo_url: 'https://images.unsplash.com/photo-1738682767944-d3c255abac3c?fm=jpg&q=70&w=1200&auto=format&fit=crop',
  },
  {
    place_slug: 'ciudad-de-mexico',
    customer: 'Ale T.',
    city: 'CDMX',
    rating: 4,
    comment: 'Buenísima calidad del marco de nogal. Tardó un poco más de lo esperado en llegar.',
    photo_url: null,
  },
];

export function dummyReviewsFor(slug) {
  return DUMMY_REVIEWS.filter((r) => r.place_slug === slug);
}
