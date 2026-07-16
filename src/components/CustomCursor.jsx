// Issue #42 — custom cursor: dot that grows to a contextual pill on hover.
// Only enabled on fine-pointer (mouse) devices; touch keeps the native cursor.
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [label, setLabel] = useState(null);
  const [enabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
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

  if (!enabled) return null;

  return (
    <div
      className="fixed z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-[width,height] duration-200"
      style={{ left: pos.x, top: pos.y }}
    >
      {label ? (
        <span className="flex items-center justify-center h-9 px-4 rounded-full bg-navy text-bg-dark font-label uppercase tracking-wide text-xs whitespace-nowrap">
          {label}
        </span>
      ) : (
        <span className="block w-2 h-2 rounded-full bg-navy" />
      )}
    </div>
  );
}
