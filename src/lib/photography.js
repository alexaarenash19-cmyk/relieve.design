// Resolves placeholder/real photography by path convention (see
// src/assets/photography/README.md). New pieces/<slug>/ folders are picked
// up automatically via import.meta.glob — adding a piece's photos needs no
// edit here, only the correctly-named files.
import heroAerialCity from '../assets/photography/hero/aerial-city.jpg';
import aboutProceso from '../assets/photography/about/proceso.jpg';
import aboutImpresion from '../assets/photography/about/impresion.jpg';

const pieceMains = import.meta.glob(
  '../assets/photography/pieces/*/main.{jpg,jpeg,png,webp}',
  {
    eager: true,
    import: 'default',
  },
);
const pieceDetails = import.meta.glob(
  '../assets/photography/pieces/*/detail-1.{jpg,jpeg,png,webp}',
  {
    eager: true,
    import: 'default',
  },
);

function slugFromPath(path) {
  return path.match(/pieces\/([^/]+)\//)?.[1];
}

const mainBySlug = Object.fromEntries(
  Object.entries(pieceMains).map(([path, url]) => [slugFromPath(path), url]),
);
const detailBySlug = Object.fromEntries(
  Object.entries(pieceDetails).map(([path, url]) => [slugFromPath(path), url]),
);

export const HERO_AERIAL_CITY = heroAerialCity;
export const ABOUT_PROCESO = aboutProceso;
export const ABOUT_IMPRESION = aboutImpresion;

export function pieceMainPhoto(slug) {
  return mainBySlug[slug] ?? null;
}

export function pieceDetailPhoto(slug) {
  return detailBySlug[slug] ?? null;
}

// Canvas tiles render photos at ~180px (90px on mobile), but thumb_url from
// the catalog can be a full-size remote image (e.g. Unsplash `w=1200`) —
// requesting and decoding that in full is wasted bandwidth/CPU for a small
// tile. Overrides the `w` query param down to a tile-appropriate width;
// falls back to the original URL untouched for local bundled assets
// (relative import.meta.glob paths, no `w` param to override) or any URL
// that fails to parse.
export function thumbUrlForWidth(url, width) {
  if (!url) return url;
  try {
    const u = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : undefined,
    );
    if (!u.searchParams.has('w')) return url;
    u.searchParams.set('w', String(width));
    return u.toString();
  } catch {
    return url;
  }
}
