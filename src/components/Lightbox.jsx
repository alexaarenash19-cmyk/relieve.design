// PRD "Relieve: Fix de carga + paridad de efectos con Palmer" sección 2.4 —
// fullscreen photo viewer with TEXT navigation controls (prev · next ·
// close), not icon buttons. Reusable wherever a photo carousel needs a
// "view larger" expansion (the product panel's carousel today).
import { useEffect } from 'react';

export default function Lightbox({ photos, index, onIndexChange, onClose }) {
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

  return (
    <div
      className="fixed inset-0 z-[150] bg-dark-bg/95 flex items-center justify-center"
      onClick={onClose}
    >
      <img
        src={photos[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[80vh] object-contain"
      />

      <div
        className="absolute bottom-6 left-6 font-label uppercase tracking-wide text-xs text-gallery-white/80"
        onClick={(e) => e.stopPropagation()}
      >
        {index + 1}/{photos.length}
      </div>

      <div
        className="absolute bottom-6 right-6 flex gap-4 font-label uppercase tracking-wide text-xs text-gallery-white"
        onClick={(e) => e.stopPropagation()}
      >
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
        <button className="underline underline-offset-4" onClick={onClose}>
          close
        </button>
      </div>
    </div>
  );
}
