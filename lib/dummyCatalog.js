// PLACEHOLDER — served by api/catalog.js only when the real Supabase query
// fails (no catalog connected yet), so /buscar, the gallery, and
// /pieza/:slug are fully testable today. Once Supabase has real data the
// queries succeed and this file stops being reached — nothing to flip off
// by hand. Mirrors the real catalog: 5 wall pieces (Ciudades Clásica +
// Ciudad de México) + 1 puzzle (Nevado de Toluca) — everything else was
// dev-phase filler and was removed from both the real catalog and this
// fallback together, so a Supabase outage can never resurrect a
// discontinued placeholder piece. thumb_url is null throughout: the local
// bundled photo (src/lib/photography.js) already covers all 5 wall pieces
// regardless of this fallback.
const img = (id) => `https://images.unsplash.com/photo-${id}?q=70&w=1200&auto=format&fit=crop`;

export const DUMMY_PLACES = [
  {
    id: 1001,
    slug: 'barcelona',
    name: 'Barcelona',
    type: 'ciudad',
    lat: 41.385064,
    lng: 2.173404,
    elevation_m: null,
    story: null,
    aerial_url: null,
    model_url: null,
    thumb_url: null,
    base_price_cents: 129900,
    status: 'active',
  },
  {
    id: 1002,
    slug: 'paris',
    name: 'París',
    type: 'ciudad',
    lat: 48.856613,
    lng: 2.352222,
    elevation_m: null,
    story: null,
    aerial_url: null,
    model_url: null,
    thumb_url: null,
    base_price_cents: 129900,
    status: 'active',
  },
  {
    id: 1003,
    slug: 'londres',
    name: 'Londres',
    type: 'ciudad',
    lat: 51.507351,
    lng: -0.127758,
    elevation_m: null,
    story: null,
    aerial_url: null,
    model_url: null,
    thumb_url: null,
    base_price_cents: 129900,
    status: 'active',
  },
  {
    id: 1004,
    slug: 'shanghai',
    name: 'Shanghái',
    type: 'ciudad',
    lat: 31.230391,
    lng: 121.473701,
    elevation_m: null,
    story: null,
    aerial_url: null,
    model_url: null,
    thumb_url: null,
    base_price_cents: 129900,
    status: 'active',
  },
  {
    id: 1005,
    slug: 'ciudad-de-mexico',
    name: 'Ciudad de México',
    type: 'ciudad',
    lat: 19.432608,
    lng: -99.133209,
    elevation_m: null,
    story: 'El Zócalo, la traza reticular del centro y el Ángel a lo lejos: la Ciudad de México en relieve es, sobre todo, una cuenca llena de calles.',
    aerial_url: null,
    model_url: null,
    thumb_url: null,
    base_price_cents: 129900,
    status: 'active',
  },
  {
    // No lat/lng/elevation on purpose — Ale asked not to use coordinates
    // for this piece at all, unlike the wall pieces (see Product.jsx: it
    // already skips the coordinates spec row and the story paragraph when
    // they're null). story is null until Ale sends real copy.
    id: 1006,
    slug: 'nevado-de-toluca',
    name: 'Nevado de Toluca',
    type: 'juego',
    lat: null,
    lng: null,
    elevation_m: null,
    story: null,
    aerial_url: null,
    model_url: null,
    thumb_url: null,
    base_price_cents: 129900,
    status: 'active',
  },
];

export function findDummyPlace(slug) {
  return DUMMY_PLACES.find((p) => p.slug === slug) ?? null;
}

// Mirrors supabase/migrations/20260716130001_seed_catalog.sql (as amended
// by 20260727010001_catalog_cleanup_and_puzzle.sql) — used as a pricing
// fallback (lib/pricing.js) when the sizes/frames/addons tables aren't
// reachable either. Real dims per size live in src/lib/catalog.js; this
// only needs the price_cents each code maps to.
export const DUMMY_SIZES = {
  chico: 99900,
  mediano: 129900,
  grande: 169900,
  especial: 249900,
  puzzle: 129900,
};
export const DUMMY_FRAMES = {
  parota: 0,
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
    place_slug: 'ciudad-de-mexico',
    customer: 'Ale T.',
    city: 'CDMX',
    rating: 4,
    comment: 'Buenísima calidad del marco de parota. Tardó un poco más de lo esperado en llegar.',
    photo_url: null,
  },
];

export function dummyReviewsFor(slug) {
  return DUMMY_REVIEWS.filter((r) => r.place_slug === slug);
}
