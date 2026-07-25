// Issue #83 — "Cómo llega / cómo se cuelga" en 3 pasos con fotos
// (ui-ux.md, página de producto). Same universal sequence for every piece
// (packing/hanging doesn't vary by place), so it's not per-slug like
// pieceMainPhoto — steps that have no real photo yet fall back to a
// TopoLines placeholder rather than breaking (decisions.md #6: "sin imagen
// todavía" must always have a visual fallback, extended here from catalog
// photos to this section).
import TopoLines from './TopoLines.jsx';
import { howItArrivesPhoto } from '../lib/photography.js';

export default function HowItArrives({ steps }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {steps.map((step, i) => {
        const photo = howItArrivesPhoto(i + 1);
        return (
          <div key={step.label}>
            <div className="relative aspect-square rounded-[9px] overflow-hidden border border-line flex items-center justify-center bg-gallery-white">
              {photo ? (
                <img
                  src={photo}
                  alt={step.detail}
                  className="warm-photo w-full h-full object-cover"
                />
              ) : (
                <TopoLines className="w-full h-full text-graphite/30" />
              )}
              <span className="absolute top-2 left-2 font-label uppercase tracking-wide text-[10px] bg-gallery-white/90 px-2 py-0.5 rounded-full border border-line">
                {i + 1}
              </span>
            </div>
            <p className="font-label uppercase tracking-wide text-[11px] mt-2 mb-0.5">
              {step.label}
            </p>
            <p className="text-xs text-graphite/70 leading-snug">{step.detail}</p>
          </div>
        );
      })}
    </div>
  );
}
