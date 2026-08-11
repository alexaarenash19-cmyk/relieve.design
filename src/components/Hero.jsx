// Was HeroReducedMotion.jsx (Issue #47) — the pinned/scroll-jacked hero
// (former HeroSection.jsx + HeroScrollSection.jsx + HeroScrollContext.jsx,
// Lenis + GSAP ScrollTrigger pin:true/scrub) was removed outright rather
// than patched: apple-design audit (11 ago 2026) found it hard-traps
// keyboard scroll (Home/End didn't reach the top — window.scrollHeight
// never matched the visible content because the whole thing lived in a
// fixed full-viewport layer driven by virtual scroll progress, not normal
// document flow) and it had no accessible completion signal beyond a
// magic 0.995 scroll-progress threshold. This component — originally 3
// static snapshots of the hero stages via HeroScene (the R3F placeholder-
// block-and-frame-bars storyboard) fading in on scroll — was already the
// graceful-degradation path for touch/reduced-motion/narrow viewports, so
// it briefly became *the* hero for everyone.
//
// Ale's direct call the same day: drop the HeroScene storyboard entirely
// (screenshotted live — a plain white box with two beige planks flying at
// it mid-transform, with no real GLB model behind it yet per HeroScene's
// own placeholder-primitive comment, reads as broken programmer art, not
// a product visual). What's left is just the photo hero: image, headline,
// copy, CTA. HeroScene.jsx/heroStages.js are unused now but left in the
// repo rather than deleted in the same pass as this urgent fix — nothing
// imports them anymore, so they're inert, not shipped.
import { useFadeInView } from '../lib/useFadeInView.js';
import Button from './Button.jsx';
import { HERO_AERIAL_CITY } from '../lib/photography.js';
import { SHOW_SOCIAL_PROOF } from '../lib/catalog.js';

export default function Hero() {
  const [ref, visible] = useFadeInView();
  return (
    <div ref={ref} className="transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }}>
      <div className="relative aspect-video bg-gallery-white overflow-hidden">
        <img src={HERO_AERIAL_CITY} alt="" className="warm-photo absolute inset-0 w-full h-full object-cover" />
        {/* apple-design audit (11 ago 2026) — the previous fix here was a
            dark text-shadow on dark (text-brand-dark) text: over the
            photo's own dark regions (building silhouettes) a dark halo
            adds nothing, which is exactly where the headline was
            unreadable live. This is a light, warm scrim concentrated
            behind the actual text block and fading to fully transparent
            by ~85% across/down — it guarantees contrast for dark text
            without putting a flat panel over the whole photo (keeping
            the "no solid background" intent HeroSection.jsx's original
            comment described). The per-element textShadow below stays
            as a second, cheap line of defense over whatever of the
            photo peeks through the scrim's fade.
            Widened 11 ago 2026 (apple-design audit follow-up): the copy
            paragraph's bottom-right corner — over the photo's darkest
            glass reflection — was still only marginally readable. Pushed
            the ellipse out to 110%/100%, recentered a touch lower (10%
            from top, roughly the copy block's vertical middle rather
            than its top edge), and added a mid-opacity stop at 68% so
            the tail fades out gradually instead of cutting off hard. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 110% 100% at 0% 10%, rgba(246,243,237,0.82) 0%, rgba(246,243,237,0.55) 45%, rgba(246,243,237,0.18) 68%, rgba(246,243,237,0) 85%)',
          }}
        />
        <div className="absolute top-8 left-8 right-8 md:right-auto md:max-w-xl">
          <h1 className="font-heading font-bold text-brand-dark text-[clamp(2rem,3.2vw+1rem,3.75rem)] leading-[1.05] tracking-[-0.02em]" style={{ textShadow: '0 2px 24px rgba(26,27,25,0.35)' }}>
            No recuerdas un lugar. Recuerdas quién eras ahí.
          </h1>
          <h2 className="mt-3 font-heading font-bold text-brand-dark text-[clamp(0.9rem,1vw+0.6rem,1.15rem)] leading-snug" style={{ textShadow: '0 2px 16px rgba(26,27,25,0.3)' }}>
            Relieve talla ese lugar en relieve topográfico, montado en madera, con calidad de galería — hecho por encargo, una pieza a la vez.
          </h2>
          <Button as="a" href="/colecciones" className="mt-5">
            Encargar mi pieza
          </Button>
          <p className="mt-2 text-[clamp(0.7rem,0.55vw+0.5rem,0.85rem)] leading-snug text-dark-fg/70" style={{ textShadow: '0 2px 12px rgba(26,27,25,0.25)' }}>
            Hecho a mano en México · Sin inventario · Cada pieza es única
          </p>
          {SHOW_SOCIAL_PROOF && (
            <p className="mt-2 text-[clamp(0.7rem,0.55vw+0.5rem,0.85rem)] leading-snug text-dark-fg/70 underline" style={{ textShadow: '0 2px 12px rgba(26,27,25,0.25)' }}>
              Las primeras piezas ya están en paredes reales — mira dónde.
            </p>
          )}
          <p className="mt-4 text-[clamp(0.7rem,0.5vw+0.5rem,0.82rem)] leading-snug text-dark-fg/60 max-w-md" style={{ textShadow: '0 2px 12px rgba(26,27,25,0.25)' }}>
            Relieve Design es un estudio mexicano que crea mapas en relieve impresos en 3D con marco de madera noble mexicana, diseñados por arquitectos y hechos a mano en México.
          </p>
        </div>
      </div>
    </div>
  );
}
