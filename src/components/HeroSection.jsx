// Issue #46 — reads the scroll progress from HeroScrollContext and drives the
// heading (stage 1 shows it, stage 3 shrinks/disappears it) alongside HeroScene.
import HeroScene from './HeroScene.jsx';
import { useHeroScroll } from '../context/HeroScrollContext.jsx';
import { stageProgress } from '../lib/heroStages.js';

export default function HeroSection() {
  const { progress } = useHeroScroll();
  const stage3 = stageProgress(progress, 2);
  const headingOpacity = 1 - stage3;
  const headingScale = 1 - stage3 * 0.3;

  return (
    <>
      <h1
        className="p-8 font-display font-light text-[clamp(3.5rem,4vw+2rem,6rem)] leading-[1.05] tracking-[-0.02em]"
        style={{ opacity: headingOpacity, transform: `scale(${headingScale})`, transformOrigin: 'left top' }}
      >
        Relieve
      </h1>
      <HeroScene progress={progress} />
    </>
  );
}
