// Shared photo carousel: big photo (click to open the Lightbox) + a
// thumbnail strip to jump between shots. Used by both the full product
// page (Product.jsx) and the quick-view panel (ProductPanel.jsx) — was
// previously duplicated inline in ProductPanel only, and Product.jsx had
// no real carousel at all (just main+detail-1, no lightbox). Takes a plain
// array of photo URLs (src/lib/photography.js's piecePhotos) instead of
// assuming a fixed main/detail shape, so a piece with any number of bundled
// photos (or zero, before Ale uploads any) works the same way.
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
  const photoLoaded = photo && loadedUrls.has(photo);

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
          <img
            src={photo}
            alt={alt}
            onLoad={() => setLoadedUrls((prev) => (prev.has(photo) ? prev : new Set(prev).add(photo)))}
            className={`w-full h-full object-cover transition-opacity duration-300 ${photoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <span className="font-label uppercase tracking-wide text-xs px-3 py-1">
            {placeholderLabel}
          </span>
        )}
        {overlay}
      </button>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3">
          {photos.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-[6px] overflow-hidden border-2 ${
                active === i ? 'border-sello-navy' : 'border-line'
              }`}
            >
              <img src={url} alt="" className="warm-photo w-full h-full object-cover" />
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
