// Issue #52 — price "rolls" numerically to the new total on selection change.
import { useEffect, useRef, useState } from 'react';

export default function RollingPrice({ cents, className = '' }) {
  const [display, setDisplay] = useState(cents);
  const fromRef = useRef(cents);

  useEffect(() => {
    const from = fromRef.current;
    const to = cents;

    // Hallazgo (auditoría 10 ago 2026): único componente animado del sitio
    // que no respetaba prefers-reduced-motion, a diferencia de CSS y del
    // resto de JS (LoadingReveal, lib/animations.js). Salta directo al
    // valor final en vez de correr los ~400ms de rAF.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }

    const start = performance.now();
    const duration = 400;

    let frame;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (to - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cents]);

  return (
    <span className={className}>
      ${(display / 100).toLocaleString('es-MX')} MXN
    </span>
  );
}
