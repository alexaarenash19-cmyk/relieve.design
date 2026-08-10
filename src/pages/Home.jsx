// PRD "Relieve: Fix de carga + paridad de efectos con Palmer", sección 3 —
// the hero plays once per browser session (sessionStorage, not localStorage
// — resets on a new tab, the more conservative/reversible option per Ale).
// After it finishes, a page-wipe covers the screen, the hero unmounts
// entirely (not just hidden — releases its GSAP ScrollTrigger/Lenis
// instance), and the canvas mounts fresh with a brief zoom-in. On a repeat
// visit within the same session, the canvas mounts directly, no hero in
// the tree at all.
//
// prefers-reduced-motion is intentionally left out of this gating: that
// fallback (HeroReducedMotion) is already a static, non-pinned, scroll-flow
// stack of steps with no scroll-hijacking — it has no completion signal to
// gate on, and it isn't the animated experience this PRD item is about.
// It keeps its existing always-shown, hero-then-scroll-to-canvas behavior.
import { useEffect, useRef, useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import HeroScrollSection from '../components/HeroScrollSection.jsx';
import HeroReducedMotion from '../components/HeroReducedMotion.jsx';
import {
  HeroScrollProvider,
  useHeroScroll,
} from '../context/HeroScrollContext.jsx';
import { usePageWipe } from '../context/PageWipeContext.jsx';
import Gallery from '../components/Gallery.jsx';
import CurvaDeNivel from '../components/CurvaDeNivel.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';

const HERO_SEEN_KEY = 'relieve_hero_seen';

// 2026-08-09 rebrand hand-off §5 (mobile hard restriction) — the pinned/
// scroll-jacked hero (HeroScrollSection, Lenis + GSAP ScrollTrigger pin:
// true) must never run on touch devices: pinned scroll fights native touch
// momentum scrolling instead of the mouse-wheel/trackpad input it was built
// for. Reuses the existing HeroReducedMotion fallback (already a static,
// non-pinned, fade-in-on-scroll stack — exactly what a "no scroll-jacking"
// mobile hero needs) instead of building a separate mobile hero from
// scratch. (pointer: coarse) is the primary signal (matches Nav.jsx's own
// (pointer: fine) convention for the same fine/coarse input distinction);
// the width check is a safety net for hybrid devices that misreport
// pointer capability, using Gallery.jsx's own MOBILE_BREAKPOINT (640) so
// this stays consistent with the canvas's existing mobile threshold rather
// than inventing a new one.
function prefersStaticHero() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 640
  );
}

function heroAlreadySeen() {
  try {
    return (
      typeof window !== 'undefined' &&
      sessionStorage.getItem(HERO_SEEN_KEY) === '1'
    );
  } catch {
    return false; // storage disabled/unavailable — treat as first visit, harmless replay
  }
}

// Watches the hero's scroll progress (0-1, via HeroScrollContext) and fires
// once when it completes. Rendered inside HeroScrollProvider so it can read
// progress; renders nothing itself.
// GSAP's ScrollTrigger scrub progress lands a hair short of the literal
// value 1 at the true end of scroll (measured live: ~0.997 at max native
// scroll, browser verification 2026-07-20) — Lenis's virtual scroll and the
// pin-spacer's height are each independently rounded, so their combined
// "done" point almost never lands on an exact float 1. Waiting for a
// strict === 1 left the hero-once transition unreachable by scrolling.
const HERO_COMPLETE_THRESHOLD = 0.995;

function HeroCompletionWatcher({ onDone }) {
  const { progress } = useHeroScroll();
  const { wipe } = usePageWipe();
  const firedRef = useRef(false);

  useEffect(() => {
    if (progress < HERO_COMPLETE_THRESHOLD || firedRef.current) return;
    firedRef.current = true;
    try {
      sessionStorage.setItem(HERO_SEEN_KEY, '1');
    } catch {
      // storage unavailable — the hero will just replay next visit, not fatal
    }
    wipe(() => {
      // Reset real scroll position: the pinned hero advances window scroll
      // as it scrubs (~3 viewport-heights), and the canvas needs to render
      // as a fresh full-viewport view, not wherever scroll happened to land.
      window.scrollTo(0, 0);
      onDone();
    });
  }, [progress, wipe, onDone]);

  return null;
}

export default function Home() {
  const [reduceMotion] = useState(prefersStaticHero);
  const [pastHero, setPastHero] = useState(heroAlreadySeen);
  const [justArrived, setJustArrived] = useState(false);

  // Resets the <title>/meta/canonical back to the site defaults (already
  // baked into index.html for the very first load) after a client-side
  // navigation away from and back to home — otherwise whatever the last
  // visited page set (e.g. a product's title) stays stuck.
  useDocumentHead({
    title: 'Relieve Design | Mapas en Relieve 3D con Marco en Madera Mexicana',
    description:
      'Mapas en relieve impresos en 3D, montados en marco de madera noble mexicana. Piezas de autor y regalos de diseño coleccionables, hechos a mano en México.',
    canonicalPath: '/',
  });

  // brand-brief.md sección 11 — estructura de Home: Hero → Canvas → Curva
  // de Nivel → Footer. CurvaDeNivel cae después del canvas en flujo normal
  // (Gallery ya no es fixed full-screen, ver Gallery.jsx); Footer se
  // renderiza en App.jsx fuera de <Routes>, así que cae después de lo que
  // sea que esta página pinte al final, sin tocar App.jsx por ruta.
  if (pastHero) {
    return (
      <>
        <Gallery zoomIn={justArrived} />
        <CurvaDeNivel />
      </>
    );
  }

  if (reduceMotion) {
    return (
      <>
        <HeroReducedMotion />
        <Gallery />
        <CurvaDeNivel />
      </>
    );
  }

  return (
    <HeroScrollProvider>
      <HeroScrollSection>
        <HeroSection />
      </HeroScrollSection>
      <HeroCompletionWatcher
        onDone={() => {
          setJustArrived(true);
          setPastHero(true);
        }}
      />
    </HeroScrollProvider>
  );
}
