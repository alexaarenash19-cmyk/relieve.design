// PRD "Relieve: Fix de carga + paridad de efectos con Palmer" sección 2.4 —
// fullscreen photo/video viewer with TEXT navigation controls (prev · next
// · close), not icon buttons. Reusable wherever PhotoCarousel needs a
// "view larger" expansion.
import { useEffect } from 'react';

export default function Lightbox({ photos, index, onIndexChange, onClose, alt = '' }) {
  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % photos.length);
      if (e.key === 'ArrowLeft')
        onIndexChange((index - 1 + photos.length) % photos.length);
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [index, photos.length, onIndexChange, onClose]);

  const photo = photos[index];

  return (
    // Hallazgo (auditoría 10 ago 2026): sin role="dialog"/aria-modal, a
    // diferencia de ProductPanel.jsx/CartDrawer.jsx — mismo tratamiento
    // ahora. (Ninguno de esos dos componentes tiene un focus trap real de
    // Tab tampoco, así que no se inventó uno aquí que no exista ya en el
    // codebase; Escape/flechas ya funcionaban vía el listener de abajo.)
    //
    // Hallazgo jsx-a11y (auditoría 10 ago 2026, sesión 5): el fondo, el
    // video/imagen y los dos clusters de controles tenían onClick sin
    // equivalente de teclado. El fondo ahora solo cierra si el clic cae
    // literalmente sobre él (e.target === e.currentTarget) — así el
    // video/imagen/contador/controles ya no necesitan su propio
    // stopPropagation, y el único onClick "real" que sobrevive (el del
    // fondo) ya tiene su equivalente de teclado cubierto por Escape (ver
    // el listener arriba) en vez de un segundo manejador redundante.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Foto ampliada'}
      className="fixed inset-0 z-[150] bg-dark-bg/95 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {photo.type === 'video' ? (
        // Native controls here (unlike the muted carousel preview) — the
        // Lightbox is where sección 10/16 decisión 10's "opción de sonido"
        // actually lives.
        <video
          src={photo.url}
          controls
          autoPlay
          loop
          playsInline
          className="max-w-[90vw] max-h-[80vh] object-contain"
        />
      ) : (
        <img
          src={photo.url}
          alt={alt}
          className="max-w-[90vw] max-h-[80vh] object-contain"
        />
      )}

      <div className="absolute bottom-6 left-6 font-label uppercase tracking-wide text-xs text-gallery-white/80">
        {index + 1}/{photos.length}
      </div>

      <div className="absolute bottom-6 right-6 flex gap-4 font-label uppercase tracking-wide text-xs text-gallery-white">
        {photos.length > 1 && (
          <>
            <button
              className="underline underline-offset-4"
              onClick={() =>
                onIndexChange((index - 1 + photos.length) % photos.length)
              }
            >
              prev
            </button>
            <button
              className="underline underline-offset-4"
              onClick={() => onIndexChange((index + 1) % photos.length)}
            >
              next
            </button>
          </>
        )}
        <button className="underline underline-offset-4 font-heading font-bold text-brand-dark" onClick={onClose}>
          close
        </button>
      </div>
    </div>
  );
}
