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
    // gsap.ticker's `time` is in SECONDS; Lenis.raf expects MILLISECONDS
    // (same scale as performance.now()/native rAF). Without *1000, Lenis's
    // internal delta-time easing thinks ~1000x less time has passed per
    // frame than actually has, so the virtual scroll position crawls toward
    // its target at ~1/1000th speed — indistinguishable from "scroll is
    // frozen" during normal interaction. This is Lenis's documented GSAP
    // integration recipe, not an optional detail.
    function raf(time) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
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
