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
        className={`warm-photo relative w-full aspect-square rounded-[9px] overflow-hidden bg-stone flex items-center justify-center ${
          photo && !photoLoaded ? 'animate-pulse' : ''
        }`}
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
          <span className="font-label uppercase tracking-wide text-xs px-3 py-1">
            {placeholderLabel}
          </span>
        )}
        {overlay}
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
        />
      )}
    </div>
  );
}
