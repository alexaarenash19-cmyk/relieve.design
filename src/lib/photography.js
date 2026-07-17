// Resolves placeholder/real photography by path convention (see
// src/assets/photography/README.md). New pieces/<slug>/ folders are picked
// up automatically via import.meta.glob — adding a piece's photos needs no
// edit here, only the correctly-named files.
import heroAerialCity from '../assets/photography/hero/aerial-city.jpg';
import aboutProceso from '../assets/photography/about/proceso.jpg';

const testimonialPhotos = import.meta.glob('../assets/photography/testimonials/*.jpg', {
  eager: true,
  import: 'default',
});
export const TESTIMONIAL_PHOTOS = Object.keys(testimonialPhotos)
  .sort()
  .map((path) => testimonialPhotos[path]);

const pieceMains = import.meta.glob('../assets/photography/pieces/*/main.jpg', {
  eager: true,
  import: 'default',
});
const pieceDetails = import.meta.glob('../assets/photography/pieces/*/detail-1.jpg', {
  eager: true,
  import: 'default',
});

function slugFromPath(path) {
  return path.match(/pieces\/([^/]+)\//)?.[1];
}

const mainBySlug = Object.fromEntries(
  Object.entries(pieceMains).map(([path, url]) => [slugFromPath(path), url])
);
const detailBySlug = Object.fromEntries(
  Object.entries(pieceDetails).map(([path, url]) => [slugFromPath(path), url])
);

export const HERO_AERIAL_CITY = heroAerialCity;
export const ABOUT_PROCESO = aboutProceso;

export function pieceMainPhoto(slug) {
  return mainBySlug[slug] ?? null;
}

export function pieceDetailPhoto(slug) {
  return detailBySlug[slug] ?? null;
}
