// Explorar spec §7 — product-focus split view, opened by clicking a tile on
// the /colecciones scattered canvas. Deliberately separate from the global
// ProductPanel.jsx/ProductPanelContext (left-drawer preview used by Home's
// teaser gallery and elsewhere) — this is a different visual pattern
// (dimmed canvas behind, center divider, name split-reveal) scoped to this
// page only. "Ver pieza completa" navigates to /pieza/:slug through the
// vertical-columns page wipe (lib/pageWipeColumns.js via PageWipeContext).
import { useNavigate } from 'react-router-dom';
import { usePageWipe } from '../context/PageWipeContext.jsx';
import { categoryLabel } from '../lib/categories.js';
import { explorerCutout } from '../lib/photography.js';
import LetterReveal from './LetterReveal.jsx';
import RollingPrice from './RollingPrice.jsx';
import TopoLines from './TopoLines.jsx';

export default function ProductFocus({ place, onClose }) {
  const navigate = useNavigate();
  const { wipe } = usePageWipe();

  if (!place) return null;

  const cutout = explorerCutout(place.slug);
  const sizeLabel = place.type === 'juego' ? '20x20 cm' : '15x15 cm';

  function handleViewFull() {
    wipe(() => navigate(`/pieza/${place.slug}`), { variant: 'columns' });
  }

  return (
    <div
      role="dialog"
      aria-label={`Vista previa de ${place.name}`}
      className="fixed inset-0 z-[80] flex flex-col md:flex-row"
    >
      {/* Dimmed canvas behind stays visible (spec §7.1: "el resto del
          lienzo permanece visible detrás pero atenuado"), so this scrim is
          semi-opaque, not a solid cover. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-graphite/50 backdrop-blur-[1px]"
      />

      <div className="relative flex-1 flex items-center justify-center p-8 md:p-16">
        {cutout ? (
          <img
            src={cutout}
            alt={place.name}
            className="max-h-[50vh] md:max-h-[70vh] w-auto object-contain drop-shadow-2xl"
            draggable={false}
          />
        ) : (
          <TopoLines className="w-2/3 max-w-xs text-dark-fg opacity-80" />
        )}
      </div>

      {/* Center divider — square close button sits ON the line itself
          (spec §7.3), not a corner icon. */}
      <div className="relative flex md:flex-col items-center justify-center">
        <div className="hidden md:block w-px h-full bg-gallery-white/40" />
        <div className="md:hidden h-px w-full bg-gallery-white/40" />
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute w-11 h-11 flex items-center justify-center bg-gallery-white text-graphite text-2xl leading-none border border-line"
        >
          ×
        </button>
      </div>

      <div className="relative flex-1 flex flex-col justify-center p-8 md:p-16 text-gallery-white">
        <LetterReveal
          key={place.slug}
          text={place.name}
          as="h2"
          className="font-display font-light text-4xl md:text-5xl mb-3"
        />
        <p
          className="font-label uppercase tracking-wide text-xs text-gallery-white/80 mb-8"
          style={{ animationDelay: '0.15s' }}
        >
          {categoryLabel(place.type)} · {sizeLabel}
        </p>

        <div className="mb-8">
          <RollingPrice
            cents={place.base_price}
            className="font-label text-2xl font-bold"
          />
        </div>

        <button
          onClick={handleViewFull}
          className="self-start md:self-end flex items-center gap-2 rounded-full bg-gallery-white text-graphite px-5 py-3 font-label uppercase tracking-wide text-xs"
        >
          Ver pieza completa
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
