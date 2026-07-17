// PLACEHOLDER — piezas dummy para poder ver /pieza/:slug completo mientras
// Supabase no tiene catálogo real. No vive en la base de datos. Quitar (o
// dejar de importar en Product.jsx) en cuanto haya piezas reales con estos
// slugs — en ese punto la API real ya responde y esto deja de usarse.
import { pieceMainPhoto, pieceDetailPhoto } from './photography.js';

const DUMMY = [
  {
    slug: 'monterrey',
    name: 'Monterrey',
    type: 'ciudad',
    lat: 25.686613,
    lng: -100.316116,
    elevation_m: null,
    story: 'Rodeada por la Sierra Madre Oriental, la silueta de Monterrey mezcla el trazo industrial del norte con el filo del Cerro de la Silla al fondo.',
    base_price: 129900,
    status: 'active',
    reviews_count: 0,
  },
  {
    slug: 'popocatepetl',
    name: 'Popocatépetl',
    type: 'montana',
    lat: 19.023056,
    lng: -98.622778,
    elevation_m: 5426,
    story: 'El Popocatépetl se eleva 5,426 msnm sobre el Valle de México y Puebla — un volcán activo, no una montaña cualquiera.',
    base_price: 129900,
    status: 'active',
    reviews_count: 0,
  },
];

export function dummyProduct(slug) {
  const place = DUMMY.find((p) => p.slug === slug);
  if (!place) return null;
  return {
    ...place,
    thumb_url: pieceMainPhoto(slug),
    detail_url: pieceDetailPhoto(slug),
  };
}
