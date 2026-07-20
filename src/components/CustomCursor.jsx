// Issue #42, reworked per PRD "Relieve: Fix de carga + paridad de efectos
// con Palmer" sección 2.1 — replaces the native pointer over the canvas
// with an icon reflecting the interaction underneath (data-cursor on the
// element under the pointer: "drag" | "view" | "close"), following the real
// cursor with a lerp/smoothing pass via requestAnimationFrame instead of
// 1:1. Only enabled on fine-pointer (mouse) devices; touch keeps the
// native cursor.
import { useEffect, useRef, useState } from 'react';
import { lerp } from '../lib/heroStages.js';

const LERP_FACTOR = 0.2;

function DragIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => <circle key={`${r}-${c}`} cx={c * 5 + 1} cy={r * 5 + 1} r="1" fill="currentColor" />)
      )}
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 14 10" width="14" height="10" aria-hidden="true">
      <path d="M1 5C2.5 2 4.5 1 7 1s4.5 1 6 4c-1.5 3-3.5 4-6 4S2.5 8 1 5Z" fill="none" stroke="currentColor" />
      <circle cx="7" cy="5" r="1.6" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
      <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

const ICONS = { drag: DragIcon, view: ViewIcon, close: CloseIcon };

export default function CustomCursor() {
  const [enabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  );
  const [kind, setKind] = useState(null);
  const elRef = useRef(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const posRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled) return;

    function onMove(e) {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setKind(e.target.closest('[data-cursor]')?.getAttribute('data-cursor') ?? null);
    }
    window.addEventListener('pointermove', onMove);

    let rafId = requestAnimationFrame(function tick() {
      const p = posRef.current;
      const t = targetRef.current;
      p.x = lerp(p.x, t.x, LERP_FACTOR);
      p.y = lerp(p.y, t.y, LERP_FACTOR);
      if (elRef.current) elRef.current.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(tick);
    });

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  const Icon = ICONS[kind];

  return (
    <div
      ref={elRef}
      className={`fixed top-0 left-0 z-[100] pointer-events-none flex items-center justify-center w-9 h-9 rounded-full bg-sello-navy text-dark-bg transition-opacity duration-200 ${
        Icon ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {Icon && <Icon />}
    </div>
  );
}
