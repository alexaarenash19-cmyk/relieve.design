// Issue #84 — product details accordion. Native disclosure semantics
// (button + aria-expanded/aria-controls), not <details> — <details> has no
// hook for the CSS grid-template-rows open/close transition (see
// .accordion-content in index.css), which needs a real element to animate.
//
// Museográfico pass (11 ago 2026) — now also used to collapse Product.jsx's
// "Ficha técnica" section (single item, its own Accordion instance,
// separate from the "Detalles" one). Content changed from <p> to <div>:
// FichaTecnica.jsx renders a <figure> (block element), invalid inside a
// <p>. Plain-string content (the existing "Detalles" items) renders
// identically inside a <div> with the same classes, so this is
// backward-compatible — confirmed via repo search that Product.jsx is the
// only consumer of this component.
import { useId, useState } from 'react';

export default function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const baseId = useId();

  return (
    <div className="border-t border-line">
      {items.map(({ title, content }, i) => {
        const open = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={title} className="border-b border-line">
            <h3 className="m-0 font-heading font-bold text-brand-dark">
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-3 text-left font-heading font-bold text-brand-dark uppercase tracking-wide text-xs"
              >
                {title}
                <span
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: open ? 'rotate(45deg)' : 'none' }}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="accordion-content"
              data-open={open}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pb-4 text-sm leading-relaxed text-graphite/80">{content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
