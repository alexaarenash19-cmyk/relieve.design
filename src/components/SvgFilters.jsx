// Checkpoint 4 — shared SVG filter defs, mounted once (App.jsx) so every
// <Stamp> can reference the same #stamp-grunge id via CSS `filter:
// url(#stamp-grunge)` instead of each instance embedding (and ID-colliding
// on) its own <filter>. Distresses a clean vector edge into worn ink.
export default function SvgFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="stamp-grunge" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.09" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
