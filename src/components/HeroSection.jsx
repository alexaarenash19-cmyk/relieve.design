// Checkpoint 4 — hero etapa 1 rebuilt per the photography direction: the
// aerial photo fills the whole hero, giant Fraunces sits directly on top of
// it (not in a separate light block above), and contour lines are drawn as
// an overlay on the photo itself. No solid dark background anywhere here —
// --gallery-white is the only fallback ground, and once the photo fades
// (stage 4, the print goes white) that's what shows through.
import HeroScene from './HeroScene.jsx';
import TopoLines from './TopoLines.jsx';
import Button from './Button.jsx';
import { useHeroScroll } from '../context/HeroScrollContext.jsx';
import { stageProgress } from '../lib/heroStages.js';
import { HERO_AERIAL_CITY } from '../lib/photography.js';
import { SHOW_SOCIAL_PROOF } from '../lib/catalog.js';

export default function HeroSection() {
  const { progress } = useHeroScroll();
  const stage3 = stageProgress(progress, 2);
  const stage4 = stageProgress(progress, 3);
  const headingOpacity = 1 - stage3;
  const headingScale = 1 - stage3 * 0.3;
  const photoOpacity = 1 - stage4; // fades as the crop lifts and goes white (stage 4)

  return (
    <div className="relative aspect-video bg-gallery-white overflow-hidden">
      <img
        src={HERO_AERIAL_CITY}
        alt=""
        className="warm-photo absolute inset-0 w-full h-full object-cover"
        style={{ opacity: photoOpacity }}
      />
      <TopoLines
        className="absolute inset-0 w-full h-full text-dark-fg mix-blend-screen pointer-events-none"
        style={{ opacity: photoOpacity * 0.75 }}
      />
      <div
        className="absolute top-8 left-8 right-8 md:right-auto md:max-w-xl"
        style={{
          opacity: headingOpacity,
          transform: `scale(${headingScale})`,
          transformOrigin: 'left top',
        }}
      >
        <h1
          className="font-display font-light text-[clamp(2rem,3.2vw+1rem,3.75rem)] leading-[1.05] tracking-[-0.02em] text-dark-fg"
          style={{ textShadow: '0 2px 24px rgba(26,27,25,0.55)' }}
        >
          No recuerdas un lugar. Recuerdas quién eras ahí.
        </h1>
        <h2
          className="mt-3 font-light text-[clamp(0.9rem,1vw+0.6rem,1.15rem)] leading-snug text-dark-fg/90"
          style={{ textShadow: '0 2px 16px rgba(26,27,25,0.5)' }}
        >
          Relieve talla ese lugar en relieve topográfico, montado en madera, con calidad de galería — hecho por encargo, una pieza a la vez.
        </h2>
        <Button as="a" href="/colecciones" className="mt-5">
          Encargar mi pieza
        </Button>
        <p
          className="mt-2 text-[clamp(0.7rem,0.55vw+0.5rem,0.85rem)] leading-snug text-dark-fg/70"
          style={{ textShadow: '0 2px 12px rgba(26,27,25,0.45)' }}
        >
          Hecho a mano en México · Sin inventario · Cada pieza es única
        </p>
        {SHOW_SOCIAL_PROOF && (
          <p
            className="mt-2 text-[clamp(0.7rem,0.55vw+0.5rem,0.85rem)] leading-snug text-dark-fg/70 underline"
            style={{ textShadow: '0 2px 12px rgba(26,27,25,0.45)' }}
          >
            Las primeras piezas ya están en paredes reales — mira dónde.
          </p>
        )}
        <p
          className="mt-4 text-[clamp(0.7rem,0.5vw+0.5rem,0.82rem)] leading-snug text-dark-fg/60 max-w-md"
          style={{ textShadow: '0 2px 12px rgba(26,27,25,0.45)' }}
        >
          Relieve Design es un estudio mexicano que crea mapas en relieve impresos en 3D con marco de madera noble mexicana, diseñados por arquitectos y hechos a mano en México.
        </p>
      </div>
      <HeroScene progress={progress} />
    </div>
  );
}
