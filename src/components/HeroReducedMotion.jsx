// Issue #47 — prefers-reduced-motion fallback: 3 static snapshots of the hero
// stages, stacked in normal document flow (no pin, no scrub), each just
// fading in as it's scrolled into view. No lateral turn/frame-assembly
// choreography — per ui-ux.md "versión por pasos con fades, sin coreografía".
import { useFadeInView } from '../lib/useFadeInView.js';
import HeroScene from './HeroScene.jsx';

function Step({ progress, caption, showHeading }) {
  const [ref, visible] = useFadeInView();
  return (
    <div
      ref={ref}
      className="transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {showHeading && (
        <h1 className="p-8 font-display font-light text-[clamp(3.5rem,4vw+2rem,6rem)] leading-[1.05] tracking-[-0.02em]">
          Relieve
        </h1>
      )}
      <HeroScene progress={progress} />
      {caption && <p className="text-center py-4 text-graphite/70">{caption}</p>}
    </div>
  );
}

export default function HeroReducedMotion() {
  return (
    <div className="flex flex-col gap-16">
      <Step progress={0.05} showHeading />
      <Step progress={0.55} caption="Se imprime en relieve y se enmarca en nogal." />
      <Step progress={0.8} caption="Cada pieza, un lugar real." />
    </div>
  );
}
