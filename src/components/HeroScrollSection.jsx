// Issue #45 — Lenis smooth scroll + GSAP ScrollTrigger pin/scrub 0-100% over
// the hero. Stage transforms that react to progress are #46 (separate issue);
// this just wires the scroll plumbing and publishes progress via context.
// Respects prefers-reduced-motion: no Lenis, no pin, hero renders statically
// (full stepped fallback is #47).
import { useLayoutEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useHeroScroll } from '../context/HeroScrollContext.jsx';

gsap.registerPlugin(ScrollTrigger);

export default function HeroScrollSection({ children }) {
  const containerRef = useRef(null);
  const { setProgress } = useHeroScroll();

  useLayoutEffect(() => {
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

    // pin:true makes ScrollTrigger insert a "pin-spacer" wrapper around
    // containerRef in the real DOM, outside React's tracking. On route
    // change (Home -> any other route) this crashed the app with
    // "removeChild: not a child of this node" — two things had to be true
    // at once to fix it: gsap.context().revert() to undo the pin-spacer
    // DOM mutation (not a plain trigger.kill()), AND useLayoutEffect
    // instead of useEffect so that revert happens synchronously *before*
    // React's own commit removes this subtree — a plain useEffect cleanup
    // fires after paint, by which point React had already torn out nodes
    // GSAP had restructured, crashing before our cleanup even ran.
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(self.progress),
      });
    }, containerRef);

    // Google Fonts load async and can shift layout after ScrollTrigger's
    // initial measurement (more noticeable on a slow first-visit network
    // than on localhost) — refresh once they're actually in.
    document.fonts?.ready?.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [setProgress]);

  return <div ref={containerRef}>{children}</div>;
}
