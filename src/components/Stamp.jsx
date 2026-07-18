// P3 — "sellos tipo migratorio" motif. Reuses the same visual language as
// the passport-stamp page transition (PageStamp).
// Checkpoint 4 — distressed ink texture via the shared #stamp-grunge SVG
// filter (SvgFilters.jsx) instead of a perfectly clean vector border.
// Sobre-passport rebuild — added shape/tone so scattered visa stamps read
// as "each its own stamp" (per design refs) instead of one shape repeated.
// Defaults are unchanged so existing callers (PageStamp) render identically.
// Passport-flipbook pass — added 'oval' (4th shape, per design refs: circle/
// oval/rectangle/triangle, not all the same), an ink-bleed radial wash so
// stamps read as worn ink rather than a clean vector outline, and a resting
// drop-shadow so each stamp looks physically on top of the page.
const TONES = {
  navy: 'border-sello-navy text-sello-navy',
  ink: 'border-passport-ink text-passport-ink',
  walnut: 'border-walnut text-walnut',
  sage: 'border-sage text-sage',
};

const TONE_HEX = {
  navy: '#22405c',
  ink: '#355a75',
  walnut: '#7a5a43',
  sage: '#aeb99e',
};

const REST_SHADOW = 'drop-shadow(2px 3px 3px rgba(35,35,35,0.18))';

export default function Stamp({
  label = 'RELIEVE · MX',
  shape = 'circle',
  tone = 'navy',
  rotate = '-rotate-6',
  className = '',
}) {
  const toneClass = TONES[tone] ?? TONES.navy;
  const hex = TONE_HEX[tone] ?? TONE_HEX.navy;
  const inkWash = { backgroundImage: `radial-gradient(circle, transparent 55%, ${hex}22 100%)` };

  if (shape === 'triangle') {
    // CSS border + clip-path only shows whatever fragment of a rectangular
    // border falls inside the clipped window — the diagonal sides were
    // never actually drawn, so they vanished. An SVG polygon stroke draws
    // a real triangle outline instead.
    return (
      <span
        className={`relative inline-flex items-end justify-center text-center font-label uppercase tracking-wide text-[9px] ${toneClass} ${rotate} ${className}`}
        style={{ width: '5.5rem', height: '5rem', filter: REST_SHADOW }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 110 100" className="absolute inset-0 w-full h-full" style={{ filter: 'url(#stamp-grunge)' }} preserveAspectRatio="none">
          <polygon points="55,4 4,96 106,96" fill="#F6F3ED" fillOpacity="0.75" />
          <polygon points="55,4 4,96 106,96" fill="none" stroke="currentColor" strokeWidth="3" />
          <polygon points="55,4 4,96 106,96" fill={hex} fillOpacity="0.12" />
        </svg>
        <span className="relative pb-2">{label}</span>
      </span>
    );
  }

  if (shape === 'oval') {
    return (
      <span
        className={`inline-flex items-center justify-center text-center bg-gallery-white/70 font-label uppercase tracking-wide text-xs border-2 ${toneClass} ${rotate} ${className}`}
        style={{ width: '7rem', height: '3.4rem', borderRadius: '50%', filter: `url(#stamp-grunge) ${REST_SHADOW}`, ...inkWash }}
        aria-hidden="true"
      >
        {label}
      </span>
    );
  }

  const shapeClass = shape === 'square' ? 'rounded-[4px] px-3 py-3' : 'rounded-full px-4 py-2';

  return (
    <span
      className={`inline-flex items-center justify-center text-center bg-gallery-white/70 font-label uppercase tracking-wide text-xs border-2 ${toneClass} ${shapeClass} ${rotate} ${className}`}
      style={{ filter: `url(#stamp-grunge) ${REST_SHADOW}`, ...inkWash }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
