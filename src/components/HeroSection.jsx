// Checkpoint 4 — hero etapa 1 rebuilt per the photography direction: the
// aerial photo fills the whole hero, giant Fraunces sits directly on top of
// it (not in a separate light block above), and contour lines are drawn as
// an overlay on the photo itself. No solid dark background anywhere here —
// --gallery-white is the only fallback ground, and once the photo fades
// (stage 4, the print goes white) that's what shows through.
import HeroScene from './HeroScene.jsx';
import TopoLines from './TopoLines.jsx';
import { useHeroScroll } from '../context/HeroScrollContext.jsx';
import { stageProgress } from '../lib/heroStages.js';
import { HERO_AERIAL_CITY } from '../lib/photography.js';

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
      <h1
        className="absolute top-8 left-8 font-display font-light text-[clamp(3.5rem,4vw+2rem,6rem)] leading-[1.05] tracking-[-0.02em] text-dark-fg"
        style={{
          opacity: headingOpacity,
          transform: `scale(${headingScale})`,
          transformOrigin: 'left top',
          textShadow: '0 2px 24px rgba(26,27,25,0.55)',
        }}
      >
        Relieve
      </h1>
      <HeroScene progress={progress} />
    </div>
  );
}
