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
// 480px-long-edge copies of main.{ext} — the catalog grid renders each tile
// at 175-360px (per GalleryCard/Gallery.jsx), but with no build-time image
// pipeline in this project, the plain main.jpg glob above was serving the
// full ~2048px source (measured: 217-390KB) to every tile on every visit.
// thumbUrlForWidth() can't help here — it only rewrites a `w` query param on
// *remote* URLs, and these are local bundled assets with none. Optional
// glob (no `eager`/error if a piece has no thumb yet, e.g. before one is
// generated for a newly added piece) — pieceMainThumb() falls back to the
// full-size main photo in that case, same file just not resized yet.
const pieceMainThumbs = import.meta.glob(
  '../assets/photography/pieces/*/main-thumb.{jpg,jpeg,png,webp}',
  {
    eager: true,
    import: 'default',
  },
);
// Every photo in a piece's folder, not just main/detail-1 — several pieces
// (barcelona, ciudad-de-mexico, paris, shanghai) already have extra shots
// committed (king.jpg, vista.jpg, top-view-2.jpg, en-contexto.jpg, etc.)
// that main/detail-1-only globs were leaving on disk unused. The product
// page carousel wants all of them.
const piecePhotosGlob = import.meta.glob(
  '../assets/photography/pieces/*/*.{jpg,jpeg,png,webp}',
  {
    eager: true,
    import: 'default',
  },
);
// Issue #83 — "cómo llega" 3-step section, shared across every piece (not
// per-slug like pieces/ above). Empty glob match (no files yet) resolves to
// {} same as an empty pieces/ folder would, not an error — HowItArrives.jsx
// falls back to a TopoLines placeholder per step until real photos land.
const howItArrivesSteps = import.meta.glob(
  '../assets/photography/how-it-arrives/step-*.{jpg,jpeg,png,webp}',
  {
    eager: true,
    import: 'default',
  },
);

function slugFromPath(path) {
  return path.match(/pieces\/([^/]+)\//)?.[1];
}

function fileNameFromPath(path) {
  return path.match(/\/([^/]+)\.[^./]+$/)?.[1] ?? '';
}

function stepNumberFromPath(path) {
  return path.match(/step-(\d+)/)?.[1];
}

const mainBySlug = Object.fromEntries(
  Object.entries(pieceMains).map(([path, url]) => [slugFromPath(path), url]),
);
const mainThumbBySlug = Object.fromEntries(
  Object.entries(pieceMainThumbs).map(([path, url]) => [slugFromPath(path), url]),
);

// Groups every matched file by slug, `main` first (matching mainBySlug
// above) then the rest alphabetically by filename — a stable, predictable
// order for the carousel regardless of glob/filesystem ordering.
const photosBySlug = {};
for (const [path, url] of Object.entries(piecePhotosGlob)) {
  const slug = slugFromPath(path);
  if (!slug) continue;
  (photosBySlug[slug] ??= []).push({ file: fileNameFromPath(path), url });
}
for (const slug of Object.keys(photosBySlug)) {
  photosBySlug[slug].sort((a, b) => {
    if (a.file === 'main') return -1;
    if (b.file === 'main') return 1;
    return a.file.localeCompare(b.file);
  });
}

const howItArrivesByStep = Object.fromEntries(
  Object.entries(howItArrivesSteps).map(([path, url]) => [stepNumberFromPath(path), url]),
);

export const HERO_AERIAL_CITY = heroAerialCity;
export const ABOUT_PROCESO = aboutProceso;
export const ABOUT_IMPRESION = aboutImpresion;

export function pieceMainPhoto(slug) {
  return mainBySlug[slug] ?? null;
}

// Small catalog-tile-sized copy of the main photo — see the
// pieceMainThumbs comment above. Falls back to the full main photo, so a
// piece is never left with no image just because its thumb hasn't been
// generated yet.
export function pieceMainThumb(slug) {
  return mainThumbBySlug[slug] ?? mainBySlug[slug] ?? null;
}

// All bundled photos for a piece, main first — [] (not null) when the
// piece has none yet, so callers can map over it directly without a
// separate null check.
export function piecePhotos(slug) {
  return (photosBySlug[slug] ?? []).map((p) => p.url);
}

export function howItArrivesPhoto(stepNumber) {
  return howItArrivesByStep[String(stepNumber)] ?? null;
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
