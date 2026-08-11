// Shared photo/video carousel: big media (click to open the Lightbox) + a
// thumbnail strip to jump between shots. Used by the full product page
// (Product.jsx) — ProductPanel.jsx has its own separate inline photo strip
// by design (brand-brief.md sección 16 decisión 6: "no se fusiona, sin
// cambios de arquitectura") and does not use this component. Takes
// src/lib/photography.js's piecePhotos() shape, {url, type}[], instead of
// a plain URL array, so a piece with any number of bundled photos (or a
// trailing unboxing video, sección 10/16 decisión 10) works the same way.
import { useState } from 'react';
import Lightbox from './Lightbox.jsx';

export default function PhotoCarousel({ photos, alt = '', placeholderLabel, overlay = null }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Keyed by URL, not a single boolean, so switching back to an
  // already-loaded photo doesn't re-flash the skeleton — was a flat
  // bg-stone block with zero loading feedback (looked broken, not loading).
  const [loadedUrls, setLoadedUrls] = useState(() => new Set());
  const photo = photos[active];
  const photoLoaded = photo && loadedUrls.has(photo.url);

  function markLoaded(url) {
    setLoadedUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => photo && setLightboxOpen(true)}
        data-cursor={photo ? 'view' : undefined}
        className={`warm-photo relative w-full aspect-square rounded-[9px] overflow-hidden flex items-center justify-center ${
          // apple-design audit (11 ago 2026) — the no-photo fallback was a
          // flat bg-stone swatch with just a name label, same gap already
          // found and fixed on the Gallery.jsx canvas tiles: next to real
          // photography (every other piece has it) it read as broken, not
          // as an intentional "not photographed yet" state. Same dashed-
          // border + soft-gradient + explicit caption treatment as there,
          // for the one piece that still hits this path (nevado-de-toluca)
          // — no photo or spec invented, only the treatment of an
          // already-existing empty state.
          photo ? 'bg-stone' : 'bg-gradient-to-br from-stone to-stone/60 border border-dashed border-graphite/25'
        } ${photo && !photoLoaded ? 'animate-pulse' : ''}`}
      >
        {photo ? (
          photo.type === 'video' ? (
            // Sección 10/16 decisión 10: loop, mudo por defecto — el
            // sonido se activa en el Lightbox (controls nativos), no aquí.
            <video
              src={photo.url}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => markLoaded(photo.url)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${photoLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <img
              src={photo.url}
              alt={alt}
              onLoad={() => markLoaded(photo.url)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${photoLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-center px-3">
            <span className="font-label uppercase tracking-wide text-xs">
              {placeholderLabel}
            </span>
            <span className="text-[10px] opacity-60 italic">Próximamente</span>
          </div>
        )}
        {overlay}
        {/* Museográfico pass (11 ago 2026) — light n/N counter, additive
            only, reuses the `active` state the thumbnail strip below
            already tracks. Small pill-glass backing so it stays legible
            over any photo, not just light ones. */}
        {photos.length > 1 && (
          <span className="pill-glass absolute bottom-3 right-3 rounded-full px-2.5 py-1 font-label text-[10px] text-graphite/70">
            {active + 1} / {photos.length}
          </span>
        )}
      </button>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3">
          {photos.map((p, i) => (
            <button
              key={p.url}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded-[6px] overflow-hidden border-2 ${
                active === i ? 'border-sello-navy' : 'border-line'
              }`}
            >
              {p.type === 'video' ? (
                <>
                  <video src={p.url} muted loop autoPlay playsInline className="warm-photo w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center text-gallery-white text-xs drop-shadow">▶</span>
                </>
              ) : (
                <img src={p.url} alt="" className="warm-photo w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
      {lightboxOpen && (
        <Lightbox
          photos={photos}
          index={active}
          onIndexChange={setActive}
          onClose={() => setLightboxOpen(false)}
          // Hallazgo (auditoría 10 ago 2026): Lightbox nunca recibía el alt
          // descriptivo real que este componente ya tiene disponible (line
          // 52 arriba) — su <img> quedaba con alt="" hardcodeado.
          alt={alt}
        />
      )}
    </div>
  );
}
