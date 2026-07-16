// Issue #52 — price "rolls" numerically to the new total on selection change.
import { useEffect, useRef, useState } from 'react';

export default function RollingPrice({ cents, className = '' }) {
  const [display, setDisplay] = useState(cents);
  const fromRef = useRef(cents);

  useEffect(() => {
    const from = fromRef.current;
    const to = cents;
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
