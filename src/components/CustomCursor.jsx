// Issue #42 — custom cursor: contextual pill on hover over a
// data-cursor-label target. No persistent dot elsewhere — the only
// indicator is the pill, and only while directly over a labeled target.
// Only enabled on fine-pointer (mouse) devices; touch keeps the native cursor.
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [label, setLabel] = useState(null);
  const [enabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
  );

  useEffect(() => {
    if (!enabled) return;

    function onMove(e) {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target.closest('[data-cursor-label]');
      setLabel(target?.getAttribute('data-cursor-label') ?? null);
    }

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);

  if (!enabled || !label) return null;

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      // apple-design audit (14 ago 2026, §11): antes usaba left/top, que
      // son propiedades de layout — cada pointermove disparaba un reflow.
      // translate3d es solo compositor; el -50%/-50% del centrado (antes
      // Tailwind -translate-x-1/2 -translate-y-1/2) va encadenado en el
      // mismo transform porque un style inline reemplaza la propiedad
      // completa, no se combina con las clases.
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)` }}
    >
      {/* Hallazgo (auditoría 10 ago 2026): acento de pill fragmentado
          (Gallery.jsx fija bg-brand-dark/text-gallery-white como el único
          acento post-rebrand vía sus constantes DARK_PILL/GHOST_PILL) —
          además, bg-sello-navy + text-dark-bg medía ~1.61:1, texto casi
          invisible sobre el cursor en cualquier target con
          data-cursor-label. */}
      <span className="flex items-center justify-center h-9 px-4 rounded-full bg-brand-dark text-gallery-white font-label uppercase tracking-wide text-xs whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
