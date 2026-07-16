// Issue #47 — simple fade-in-on-scroll-into-view, no pin/scrub/choreography.
import { useEffect, useRef, useState } from 'react';

export function useFadeInView() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
