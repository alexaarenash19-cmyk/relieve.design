// Issue #84 — product details accordion. Native disclosure semantics
// (button + aria-expanded/aria-controls), not <details> — <details> has no
// hook for the CSS grid-template-rows open/close transition (see
// .accordion-content in index.css), which needs a real element to animate.
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
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-3 text-left font-label uppercase tracking-wide text-xs"
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
                <p className="pb-4 text-sm leading-relaxed text-graphite/80">{content}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
