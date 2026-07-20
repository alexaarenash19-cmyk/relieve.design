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
import { HeroScrollProvider, useHeroScroll } from '../context/HeroScrollContext.jsx';
import { usePageWipe } from '../context/PageWipeContext.jsx';
import Gallery from '../components/Gallery.jsx';

const HERO_SEEN_KEY = 'relieve_hero_seen';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function heroAlreadySeen() {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem(HERO_SEEN_KEY) === '1';
  } catch {
    return false; // storage disabled/unavailable — treat as first visit, harmless replay
  }
}

// Watches the hero's scroll progress (0-1, via HeroScrollContext) and fires
// once when it completes. Rendered inside HeroScrollProvider so it can read
// progress; renders nothing itself.
function HeroCompletionWatcher({ onDone }) {
  const { progress } = useHeroScroll();
  const { wipe } = usePageWipe();
  const firedRef = useRef(false);

  useEffect(() => {
    if (progress < 1 || firedRef.current) return;
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
  const [reduceMotion] = useState(prefersReducedMotion);
  const [pastHero, setPastHero] = useState(heroAlreadySeen);
  const [justArrived, setJustArrived] = useState(false);

  if (pastHero) {
    return <Gallery zoomIn={justArrived} />;
  }

  if (reduceMotion) {
    return (
      <>
        <HeroReducedMotion />
        <Gallery />
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
