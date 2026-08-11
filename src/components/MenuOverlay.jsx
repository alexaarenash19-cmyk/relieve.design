// Museográfico pass (11 ago 2026) — full-screen "Índice" nav overlay,
// built from scratch (no existing full-screen nav overlay in the repo —
// confirmed via search) but composed from existing primitives: the same
// accessible open/close toggling pattern already used by ProductPanel.jsx/
// CartDrawer.jsx (invisible/inert/aria-hidden instead of unmounting, so
// close animations aren't cut off mid-transition), useEscapeKey.js
// (extracted specifically in anticipation of "the next overlay
// component"), and IndexRow.jsx for the numbered nav list. No live clock,
// no workshop-location line (Ale: omit), no .security-pattern/passport
// texture — plain bg-gallery-white, consistent with the museográfico
// direction (neutral background, not thematic). No body-scroll lock,
// matching CartDrawer.jsx's own existing precedent of not locking scroll.
import { useEscapeKey } from '../lib/useEscapeKey.js';
import { NAV_ITEMS } from '../lib/navItems.js';
import IndexRow from './IndexRow.jsx';

export default function MenuOverlay({ open, onClose }) {
  useEscapeKey(onClose);

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-0 z-50 bg-gallery-white flex flex-col transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-2">
        <span className="font-label uppercase tracking-wide text-xs text-graphite/50">
          Índice
        </span>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="pill-glass rounded-full text-brand-dark px-4 py-2 font-label uppercase tracking-wide text-xs"
        >
          Cerrar
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-6 md:px-12 max-w-2xl w-full mx-auto flex flex-col justify-center">
        {NAV_ITEMS.map((item, i) => (
          <IndexRow
            key={item.path}
            n={i + 1}
            label={item.label}
            path={item.path}
            onNavigate={onClose}
          />
        ))}
      </nav>
    </div>
  );
}
