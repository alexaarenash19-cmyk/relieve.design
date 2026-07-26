// Issue #47 — prefers-reduced-motion fallback: 3 static snapshots of the hero
// stages, stacked in normal document flow (no pin, no scrub), each just
// fading in as it's scrolled into view. No lateral turn/frame-assembly
// choreography — per ui-ux.md "versión por pasos con fades, sin coreografía".
import { useFadeInView } from '../lib/useFadeInView.js';
import HeroScene from './HeroScene.jsx';
import Button from './Button.jsx';
import { HERO_AERIAL_CITY } from '../lib/photography.js';
import { SHOW_SOCIAL_PROOF } from '../lib/catalog.js';

function Step({ progress, caption, showPhoto }) {
  const [ref, visible] = useFadeInView();
  return (
    <div ref={ref} className="transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }}>
      <div className="relative aspect-video bg-gallery-white overflow-hidden">
        {showPhoto && (
          <>
            <img src={HERO_AERIAL_CITY} alt="" className="warm-photo absolute inset-0 w-full h-full object-cover" />
            <div className="absolute top-8 left-8 right-8 md:right-auto md:max-w-xl">
              <h1 className="font-display font-light text-[clamp(2rem,3.2vw+1rem,3.75rem)] leading-[1.05] tracking-[-0.02em] text-dark-fg" style={{ textShadow: '0 2px 24px rgba(26,27,25,0.55)' }}>
                No recuerdas un lugar. Recuerdas quién eras ahí.
              </h1>
              <h2 className="mt-3 font-light text-[clamp(0.9rem,1vw+0.6rem,1.15rem)] leading-snug text-dark-fg/90" style={{ textShadow: '0 2px 16px rgba(26,27,25,0.5)' }}>
                Relieve talla ese lugar en relieve topográfico, montado en madera, con calidad de galería — hecho por encargo, una pieza a la vez.
              </h2>
              <Button as="a" href="/colecciones" className="mt-5">
                Encargar mi pieza
              </Button>
              <p className="mt-2 text-[clamp(0.7rem,0.55vw+0.5rem,0.85rem)] leading-snug text-dark-fg/70" style={{ textShadow: '0 2px 12px rgba(26,27,25,0.45)' }}>
                Hecho a mano en México · Sin inventario · Cada pieza es única
              </p>
              {SHOW_SOCIAL_PROOF && (
                <p className="mt-2 text-[clamp(0.7rem,0.55vw+0.5rem,0.85rem)] leading-snug text-dark-fg/70 underline" style={{ textShadow: '0 2px 12px rgba(26,27,25,0.45)' }}>
                  Las primeras piezas ya están en paredes reales — mira dónde.
                </p>
              )}
              <p className="mt-4 text-[clamp(0.7rem,0.5vw+0.5rem,0.82rem)] leading-snug text-dark-fg/60 max-w-md" style={{ textShadow: '0 2px 12px rgba(26,27,25,0.45)' }}>
                Relieve Design es un estudio mexicano que crea mapas en relieve impresos en 3D con marco de madera noble mexicana, diseñados por arquitectos y hechos a mano en México.
              </p>
            </div>
          </>
        )}
        <HeroScene progress={progress} />
      </div>
      {caption && <p className="text-center py-4 text-graphite/70">{caption}</p>}
    </div>
  );
}

export default function HeroReducedMotion() {
  return (
    <div className="flex flex-col gap-16">
      <Step progress={0.05} showPhoto />
      <Step progress={0.55} caption="Se imprime en relieve y se enmarca en parota." />
      <Step progress={0.8} caption="Cada pieza, un lugar real." />
    </div>
  );
}
