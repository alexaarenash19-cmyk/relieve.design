// 2026-08-09 landing rebrand hand-off §3/§4 — bottom counterpart to
// TrustBar.jsx's Home-only Cempasúchil "RELIEVE" swap: "DESIGN" becomes
// the canvas's bottom border. Only the top strip gets the orange accent
// per §2 ("un solo lugar de todo el sitio con ese color") — this one
// stays on the base Piedra/Grafito pair. New component (not an edit to an
// existing one) since there's no existing bottom-of-viewport chrome to
// repurpose the way TrustBar's slot was reused for the top strip.
// Mounted directly by Home.jsx, a sibling of <Gallery/> — not inside
// Gallery.jsx itself — so it isn't caught by the `transform` on Gallery's
// internal zoom wrapper, which turns any `position: fixed` descendant's
// containing block into that wrapper instead of the real viewport (see
// the comment above BottomControlBar in Gallery.jsx for the same gotcha
// hit before).
// z-20, below Gallery's BottomControlBar (z-30, `bottom-5`) and
// DragHintAndZoom — this strip's band (0-28px from viewport bottom)
// overlaps BottomControlBar's floating pill row, so it stays a background
// layer the pills render on top of rather than fighting them for clicks.
export default function CanvasBottomStrip() {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-20 h-7 flex items-center justify-center bg-piedra border-t border-line"
      aria-hidden="true"
    >
      <span className="font-label uppercase tracking-[0.3em] text-[11px] font-bold text-grafito">
        Design
      </span>
    </div>
  );
}
