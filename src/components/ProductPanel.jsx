// PRD "Relieve: Fix de carga + paridad de efectos con Palmer", sección 4 —
// half-screen product panel opened from a canvas pin. Same overlay + slide-
// in-from-right pattern as CartDrawer.jsx (Escape/click-outside closes,
// translate-x transition), fetching the same /api/places/:slug endpoint
// Product.jsx already uses (cached — see catalog-cache-fix). Full
// personalization (size/frame/color/etc.) stays on /pieza/:slug; this is a
// lightweight preview ending in a CTA to that page, not a rebuild of it.
import { useEffect, useState } from 'react';
import { useProductPanel } from '../context/ProductPanelContext.jsx';
import { fetchJson } from '../lib/fetchJsonArray.js';
import { pieceMainPhoto, pieceDetailPhoto } from '../lib/photography.js';
import { categoryLabel } from '../lib/categories.js';
import RollingPrice from './RollingPrice.jsx';
import Button from './Button.jsx';
import TopoLines from './TopoLines.jsx';
import LetterReveal from './LetterReveal.jsx';
import Lightbox from './Lightbox.jsx';

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

function PhotoCarousel({ place }) {
  const photos = [pieceMainPhoto(place.slug) ?? place.thumb_url, pieceDetailPhoto(place.slug)].filter(Boolean);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photo = photos[active];

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        data-cursor="view"
        className="warm-photo relative w-full aspect-square rounded-[9px] overflow-hidden bg-stone block"
      >
        {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
        <TopoLines className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen opacity-70 pointer-events-none" />
      </button>
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3">
          {photos.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`w-14 h-14 rounded-[6px] overflow-hidden border-2 ${
                active === i ? 'border-sello-navy' : 'border-line'
              }`}
            >
              <img src={url} alt="" className="warm-photo w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {lightboxOpen && (
        <Lightbox photos={photos} index={active} onIndexChange={setActive} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
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

  return (
    <>
      <div
        onClick={closeProduct}
        aria-hidden="true"
        data-cursor="close"
        className={`fixed inset-0 bg-graphite/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Detalle de pieza"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 w-full md:max-w-[50vw] bg-gallery-white overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 md:p-10">
          <button
            onClick={closeProduct}
            aria-label="Cerrar"
            data-cursor="close"
            className="text-xl leading-none mb-6 block ml-auto"
          >
            ×
          </button>

          {error && <p className="text-center text-graphite/70">{error}</p>}

          {!error && place && (
            <>
              <PhotoCarousel place={place} />

              <LetterReveal
                key={place.slug}
                text={place.name}
                as="h2"
                className="font-display font-light text-3xl mt-6 mb-4"
              />

              <dl className="border-t border-line mb-6">
                <div className="grid grid-cols-2 border-b border-line py-2 font-label uppercase tracking-wide text-xs">
                  <dt className="text-graphite/60">Tipo</dt>
                  <dd>{categoryLabel(place.type)}</dd>
                </div>
                {place.elevation_m && (
                  <div className="grid grid-cols-2 border-b border-line py-2 font-label uppercase tracking-wide text-xs">
                    <dt className="text-graphite/60">Altitud</dt>
                    <dd>{place.elevation_m} msnm</dd>
                  </div>
                )}
              </dl>

              <RollingPrice cents={place.base_price} className="font-label text-2xl font-bold block mb-6" />

              <Button as="a" href={`/pieza/${place.slug}`} onClick={closeProduct} className="w-full">
                Personalizar
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
