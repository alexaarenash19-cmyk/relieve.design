// PRD-animaciones-relieve.md, efecto #3 — split-screen product view
// opened from a canvas/grid pin. Literal transcription of the "Explorar
// (preview)" artifact's #focus-overlay: a single hairline divides the
// screen exactly in half, a SQUARE close × sits centered on that line
// (not circular — the artifact's .focus-close has no border-radius at
// all), and the other half keeps showing whatever was already on screen
// (the canvas, still live and undimmed, never paused/reloaded) instead of
// a modal scrim. Full personalization (size/frame/color/etc.) stays on
// /pieza/:slug.
import { useEffect, useRef, useState } from 'react';
import { useProductPanel } from '../context/ProductPanelContext.jsx';
import { fetchJson } from '../lib/fetchJsonArray.js';
import { piecePhotos } from '../lib/photography.js';
import { categoryLabel } from '../lib/categories.js';
// Función pura de animación (spec table + fuente en el propio archivo) —
// ver src/lib/animations.js. Esa misma importación ya registra GSAP's
// CustomEase y crea 'relieveEase', así que este archivo no necesita
// tocar gsap directamente en absoluto.
import { panelOpenTimeline } from '../lib/animations.js';

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
  const [activePhoto, setActivePhoto] = useState(0);

  const titleRef = useRef(null);
  const photoRef = useRef(null);
  const metaRef = useRef(null);
  const ctaRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    setActivePhoto(0);
  }, [slug]);

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape') closeProduct();
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [closeProduct]);

  const photos = place ? piecePhotos(place.slug) : [];
  const mainPhoto = photos[activePhoto];

  // Effect #3 per PRD table: one gsap.timeline(), four .fromTo() calls at
  // exact durations/delays/eases (ver panelOpenTimeline en
  // src/lib/animations.js para la spec table completa). The panel
  // container itself has NO transition (see className below —
  // display/visibility toggles instantly via the `invisible` class); only
  // this content animates in.
  useEffect(() => {
    if (!isOpen || !place || !titleRef.current) return;
    tlRef.current?.kill();
    tlRef.current = panelOpenTimeline({
      titleEl: titleRef.current,
      photoEl: photoRef.current,
      metaEl: metaRef.current,
      ctaEl: ctaRef.current,
    });
    return () => tlRef.current?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable;
    // deliberately NOT depending on mainPhoto/activePhoto, or clicking a
    // thumbnail inside an already-open panel would replay the whole
    // entrance instead of just swapping the photo.
  }, [isOpen, place]);

  return (
    <div
      role="dialog"
      aria-label="Detalle de pieza"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex ${isOpen ? '' : 'invisible'}`}
    >
      {/* .focus-left: flex:1 1 50%, max-width:50%, bg gallery-white,
          flex-col centered, gap:16px, padding: 0 5vw. No opacity
          transition here — the artifact's panel shows instantly
          (display:none -> block); only the content inside animates. */}
      <div className="relative flex-1 max-w-full md:max-w-[50%] min-h-0 bg-gallery-white overflow-hidden flex flex-col justify-center gap-4 px-[7vw] md:px-[5vw]">
        {/* mobile-only close — the artifact hides the divider/gap below
            720px and moves the × to a plain top-right corner instead */}
        <button
          onClick={closeProduct}
          aria-label="Cerrar"
          className="md:hidden absolute top-6 right-6 w-10 h-10 border border-brand-dark bg-gallery-white text-brand-dark font-heading font-bold flex items-center justify-center text-lg leading-none"
        >
          ×
        </button>

        {error && <p className="text-center text-graphite/70">{error}</p>}

        {!error && place && (
          <>
            {/* .focus-name: Fraunces 300, clamp(1.9rem,2.8vw+1rem,3.25rem),
                line-height 1.05. Per-letter spans driven by the timeline
                above (opacity 0->1, y 8px->0, 0.5s, stagger 0.03s,
                power2.out) instead of the shared LetterReveal component,
                which runs its own separate CSS timing not on this
                timeline. */}
            <h2
              ref={titleRef}
              className="font-heading font-bold text-brand-dark text-[clamp(1.9rem,2.8vw+1rem,3.25rem)] leading-[1.05] m-0"
            >
              {[...place.name].map((c, i) => (
                <span key={i} className="inline-block">
                  {c === ' ' ? ' ' : c}
                </span>
              ))}
            </h2>

            {/* .focus-photo-row: flex row, gap 14px */}
            <div className="flex items-center gap-[14px] min-h-0">
              {photos.length > 1 && (
                // .focus-thumbs: flex-col, gap 8px; button 42x42, border-radius 2px,
                // bg-stone, opacity 0.6 -> 1 + border-color on active/hover
                <div className="flex flex-col gap-2 shrink-0">
                  {photos.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActivePhoto(i)}
                      className={`w-[42px] h-[42px] p-0 border rounded-[2px] overflow-hidden bg-stone cursor-pointer transition-[opacity,border-color] duration-200 ${
                        i === activePhoto
                          ? 'opacity-100 border-graphite'
                          : 'opacity-60 border-line hover:opacity-100 hover:border-graphite'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover block" />
                    </button>
                  ))}
                </div>
              )}
              {/* .focus-right: flex:1, max-height:40vh, aspect-ratio:1,
                  border-radius:4px, bg-stone. Photo fade-in: opacity 0->1,
                  0.5s, delay 0.15s, relieveEase (== cubic-bezier(0.2,0.6,0.2,1)) */}
              <div
                ref={photoRef}
                className="flex-1 min-w-0 max-h-[40vh] aspect-square rounded-[4px] overflow-hidden bg-stone"
              >
                <div className="w-full h-full flex items-center justify-center">
                  {mainPhoto ? (
                    <img
                      src={mainPhoto}
                      alt={place.name}
                      className="max-w-full max-h-full w-auto h-auto"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-label uppercase tracking-wide text-[0.85rem] text-gallery-white text-center bg-graphite/70">
                      {place.name.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* .focus-meta: single uppercase label line, 0.78rem,
                rgba(35,35,35,.65) — the artifact's version reads
                "TIPO — TAMAÑO", a mock field places don't have; using the
                one real, equivalent field (tipo, + altitud when present)
                instead of inventing a size here. Fade-in: opacity 0->1,
                0.4s, delay 0.5s, relieveEase. */}
            <p
              ref={metaRef}
              className="font-label uppercase tracking-wide text-[0.78rem] text-graphite/65 m-0"
            >
              {categoryLabel(place.type)}
              {place.elevation_m ? ` — ${place.elevation_m} msnm` : ''}
            </p>

            {/* .focus-cta: padding 10px 18px, font-size 0.82rem, no hover
                background change — only the arrow rotates -45deg on
                hover. Fade-in: opacity 0->1, 0.4s, delay 0.65s, relieveEase. */}
            <a
              ref={ctaRef}
              href={`/pieza/${place.slug}`}
              onClick={closeProduct}
              className="group self-start inline-flex items-center gap-2 rounded-full bg-graphite text-gallery-white px-[18px] py-[10px] font-body font-medium text-[0.82rem]"
            >
              Ver pieza completa{' '}
              <span className="inline-block transition-transform duration-[350ms] group-hover:-rotate-45">
                →
              </span>
            </a>
          </>
        )}
      </div>

      {/* .focus-divider: 1px hairline, graphite @ 25% opacity. .focus-close:
          46x46, SQUARE (no border-radius in the artifact), centered on the
          line, font-size 1.2rem, no entrance animation — only a 0.2s
          color transition on hover — hidden below 720px along with the gap */}
      <div className="hidden md:block relative w-px bg-graphite/25 shrink-0">
        <button
          onClick={closeProduct}
          aria-label="Cerrar"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46px] h-[46px] border border-brand-dark bg-gallery-white text-brand-dark font-heading font-bold flex items-center justify-center text-[1.2rem] leading-none transition-colors duration-200 hover:bg-brand-dark hover:text-gallery-white"
        >
          ×
        </button>
      </div>

      {/* .focus-canvas-gap: transparent, pointer-events:none — the canvas
          behind keeps rendering live, uninterrupted, never paused or
          reloaded. No dark scrim: this is a split view, not a modal. */}
      <div className="hidden md:block flex-1 max-w-[50%] pointer-events-none" />
    </div>
  );
}
