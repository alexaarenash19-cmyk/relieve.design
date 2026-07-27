// PRD "Relieve: Fix de carga + paridad de efectos con Palmer", sección 4 —
// split-screen product view opened from a canvas/grid pin. Reference:
// Ale's own Palmer (palmer-dinnerware.com) screenshot, 2026-07-27 — a
// single hairline divides the screen exactly in half, a big close X sits
// centered on that line, and the OTHER half keeps showing whatever was
// already on screen (the canvas, still live and undimmed, not a dark
// scrim) rather than being covered by a modal. Full personalization
// (size/frame/color/etc.) stays on /pieza/:slug; this is a lightweight
// preview ending in a CTA to that page, not a rebuild of it.
import { useEffect, useState } from 'react';
import { useProductPanel } from '../context/ProductPanelContext.jsx';
import { fetchJson } from '../lib/fetchJsonArray.js';
import { piecePhotos } from '../lib/photography.js';
import { categoryLabel } from '../lib/categories.js';
import TopoLines from './TopoLines.jsx';
import LetterReveal from './LetterReveal.jsx';
import PhotoCarousel from './PhotoCarousel.jsx';

function usePlace(slug) {
  const [place, setPlace] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchJson(`/api/places/${slug}`)
      .then((data) => {
        if (!cancelled) setPlace(data);
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar esta pieza.');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { place, error };
}

export default function ProductPanel() {
  const { slug, isOpen, closeProduct } = useProductPanel();
  const { place, error } = usePlace(slug);

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape') closeProduct();
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [closeProduct]);

  const photos = place ? piecePhotos(place.slug) : [];

  return (
    <div
      role="dialog"
      aria-label="Detalle de pieza"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex ${isOpen ? '' : 'invisible'}`}
    >
      <div
        className={`relative flex-1 max-w-full md:max-w-[50%] bg-gallery-white overflow-hidden flex flex-col justify-center gap-5 px-[7vw] md:px-[5vw] py-8 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* mobile-only close — the hairline+centered-X pattern only makes
            sense once there's a second half of the screen to divide from */}
        <button
          onClick={closeProduct}
          aria-label="Cerrar"
          className="md:hidden absolute top-4 right-4 w-10 h-10 rounded-full border border-graphite bg-gallery-white flex items-center justify-center text-lg leading-none"
        >
          ×
        </button>

        {error && <p className="text-center text-graphite/70">{error}</p>}

        {!error && place && (
          <>
            <LetterReveal
              key={place.slug}
              text={place.name}
              as="h2"
              className="font-display font-light text-[clamp(1.9rem,2.8vw+1rem,3.25rem)] leading-tight m-0"
            />

            <div className="w-full max-w-[38vh]">
              <PhotoCarousel
                photos={photos}
                alt={place.name}
                placeholderLabel={place.name}
                overlay={
                  <TopoLines className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen opacity-70 pointer-events-none" />
                }
              />
            </div>

            <dl className="m-0">
              <div className="flex gap-2 font-label uppercase tracking-wide text-xs">
                <dt className="text-graphite/60">Tipo</dt>
                <dd>{categoryLabel(place.type)}</dd>
              </div>
              {place.elevation_m && (
                <div className="flex gap-2 font-label uppercase tracking-wide text-xs mt-1">
                  <dt className="text-graphite/60">Altitud</dt>
                  <dd>{place.elevation_m} msnm</dd>
                </div>
              )}
            </dl>

            {/* Black pill, matching the "Explorar (preview)" artifact
                exactly — deliberately not the shared <Button> (that one's
                sello-navy, the site's selection-accent color elsewhere,
                e.g. Product.jsx's size/frame pickers; this quick-view CTA
                is a different, artifact-specified black). Price lives on
                the full page, not repeated here — matches the artifact's
                quick-view, which also only showed name/photo/tipo. */}
            <a
              href={`/pieza/${place.slug}`}
              onClick={closeProduct}
              className="self-start inline-flex items-center gap-2 rounded-full bg-graphite text-gallery-white px-5 py-2.5 font-body font-medium text-sm hover:bg-graphite/85 transition-colors"
            >
              Ver pieza completa <span aria-hidden="true">→</span>
            </a>
          </>
        )}
      </div>

      {/* hairline divider, the close X centered exactly on it — hidden on
          mobile, where there's no live "other half" to divide from */}
      <div className="hidden md:block relative w-px bg-graphite/25 shrink-0">
        <button
          onClick={closeProduct}
          aria-label="Cerrar"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-graphite bg-gallery-white text-graphite flex items-center justify-center text-xl leading-none hover:bg-graphite hover:text-gallery-white transition-colors"
        >
          ×
        </button>
      </div>

      {/* transparent — whatever was already on screen (the live, still-
          interactive canvas, or any other page) stays fully visible; this
          only reserves the other 50% so the split matches Ale's reference
          exactly. No dark scrim: this is a split view, not a modal. */}
      <div className="hidden md:block flex-1 max-w-[50%] pointer-events-none" />
    </div>
  );
}
