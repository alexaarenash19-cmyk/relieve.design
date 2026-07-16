// Issue #45 — Lenis smooth scroll + GSAP ScrollTrigger pin/scrub 0-100% over
// the hero. Stage transforms that react to progress are #46 (separate issue);
// this just wires the scroll plumbing and publishes progress via context.
// Respects prefers-reduced-motion: no Lenis, no pin, hero renders statically
// (full stepped fallback is #47).
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useHeroScroll } from '../context/HeroScrollContext.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function HeroScrollSection({ children }) {
  const containerRef = useRef(null);
  const { setProgress } = useHeroScroll();

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
    }
    gsap.ticker.add(raf);
    lenis.on('scroll', ScrollTrigger.update);

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: '+=300%',
      pin: true,
      scrub: true,
      onUpdate: (self) => setProgress(self.progress),
    });

    return () => {
      trigger.kill();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [setProgress]);

  return <div ref={containerRef}>{children}</div>;
}
