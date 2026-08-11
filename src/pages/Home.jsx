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
import CanvasBottomStrip from '../components/CanvasBottomStrip.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';

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
  // 2026-08-09 rebrand hand-off §3/§4 — CanvasBottomStrip mirrors
  // TrustBar.jsx's Home-only top-strip swap: present unconditionally here,
  // same "Home chrome" treatment as Nav.
  return (
    <>
      <Hero />
      <Gallery />
      <CurvaDeNivel />
      <CanvasBottomStrip />
    </>
  );
}
