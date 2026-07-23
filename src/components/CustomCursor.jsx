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
      className="fixed z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.x, top: pos.y }}
    >
      <span className="flex items-center justify-center h-9 px-4 rounded-full bg-sello-navy text-dark-bg font-label uppercase tracking-wide text-xs whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
