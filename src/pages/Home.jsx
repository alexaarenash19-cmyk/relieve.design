// apple-design audit (11 ago 2026) — this used to branch three ways: a
// pinned/scroll-jacked hero (HeroScrollSection + HeroSection, Lenis + GSAP
// ScrollTrigger pin:true) for fine-pointer desktop on a visitor's first
// session, a static stepped hero (HeroReducedMotion) for touch/reduced-
// motion/narrow viewports, and a hero-free straight-to-canvas view once
// the pinned hero had played once that session (sessionStorage-gated).
// The pinned branch is gone outright — it hard-trapped keyboard scroll
// (Home/End never reached page top; the whole thing lived in a fixed
// full-viewport layer driven by virtual scroll progress rather than real
// document flow) and its "done" signal was a magic 0.995 float threshold.
// What was the fallback (now just `Hero`, renamed from
// HeroReducedMotion — see that file's own history note) is the only hero
// left, shown to every visitor, every visit: it's normal document flow
// with plain fade-on-scroll-into-view, so there's no completion event to
// gate on and no reason to hide it from repeat visitors the way the heavy
// pinned version was.
import Hero from '../components/Hero.jsx';
import Gallery from '../components/Gallery.jsx';
import CurvaDeNivel from '../components/CurvaDeNivel.jsx';
import MonolithBanner from '../components/MonolithBanner.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import relieveWordmarkLight from '../assets/brand/relieve-wordmark-light.svg';
import relieveWordmarkDark from '../assets/brand/relieve-wordmark-dark.svg';
import designWordmarkLight from '../assets/brand/design-wordmark-light.svg';
import designWordmarkDark from '../assets/brand/design-wordmark-dark.svg';

// Each provided SVG's own viewBox aspect ratio (width / height) — passed
// through so MonolithBanner can size its crop container in `vw` without
// hardcoding either wordmark's proportions itself.
const RELIEVE_ASPECT = 1896 / 501;
const DESIGN_ASPECT = 1920 / 440;

export default function Home() {
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
  //
  // Ale's direct call (11 ago 2026): CanvasBottomStrip — the fixed
  // "DESIGN" bar pinned to the bottom of the viewport — removed outright,
  // she never asked for it. Not rendered here anymore; the component file
  // itself is also deleted in this same change since nothing else used it.
  //
  // 21 ago 2026 — MonolithBanner bookend added at the user's direct request
  // (monolith.nyc reference: oversized wordmark cropped by its own
  // container edge). Explicitly not the same thing Ale rejected above:
  // that was `position: fixed`, pinned over the viewport regardless of
  // scroll; these two sit in normal document flow, one before Hero and one
  // after CurvaDeNivel (so it lands right before Footer, which still
  // mounts in App.jsx outside <Routes>).
  return (
    <main>
      <MonolithBanner
        lightSrc={relieveWordmarkLight}
        darkSrc={relieveWordmarkDark}
        aspectRatio={RELIEVE_ASPECT}
        crop="top"
      />
      <Hero />
      <Gallery />
      <CurvaDeNivel />
      <MonolithBanner
        lightSrc={designWordmarkLight}
        darkSrc={designWordmarkDark}
        aspectRatio={DESIGN_ASPECT}
        crop="bottom"
      />
    </main>
  );
}
