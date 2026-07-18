// P3 — "sellos tipo migratorio" motif. Reuses the same visual language as
// the passport-stamp page transition (PageStamp).
// Checkpoint 4 — distressed ink texture via the shared #stamp-grunge SVG
// filter (SvgFilters.jsx) instead of a perfectly clean vector border.
// Sobre-passport rebuild — added shape/tone so scattered visa stamps read
// as "each its own stamp" (per design refs) instead of one shape repeated.
// Defaults are unchanged so existing callers (PageStamp) render identically.
const TONES = {
  navy: 'border-sello-navy text-sello-navy',
  ink: 'border-passport-ink text-passport-ink',
  walnut: 'border-walnut text-walnut',
  sage: 'border-sage text-sage',
};

export default function Stamp({
  label = 'RELIEVE · MX',
  shape = 'circle',
  tone = 'navy',
  rotate = '-rotate-6',
  className = '',
}) {
  const toneClass = TONES[tone] ?? TONES.navy;

  if (shape === 'triangle') {
    // CSS border + clip-path only shows whatever fragment of a rectangular
    // border falls inside the clipped window — the diagonal sides were
    // never actually drawn, so they vanished. An SVG polygon stroke draws
    // a real triangle outline instead.
    return (
      <span
        className={`relative inline-flex items-end justify-center text-center font-label uppercase tracking-wide text-[9px] ${toneClass} ${rotate} ${className}`}
        style={{ width: '5.5rem', height: '5rem' }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 110 100" className="absolute inset-0 w-full h-full" style={{ filter: 'url(#stamp-grunge)' }} preserveAspectRatio="none">
          <polygon points="55,4 4,96 106,96" fill="#F6F3ED" fillOpacity="0.75" />
          <polygon points="55,4 4,96 106,96" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
        <span className="relative pb-2">{label}</span>
      </span>
    );
  }

  const shapeClass = shape === 'square' ? 'rounded-[4px] px-3 py-3' : 'rounded-full px-4 py-2';

  return (
    <span
      className={`inline-flex items-center justify-center text-center bg-gallery-white/70 font-label uppercase tracking-wide text-xs border-2 ${toneClass} ${shapeClass} ${rotate} ${className}`}
      style={{ filter: 'url(#stamp-grunge)' }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
