// P3 — "sellos tipo migratorio" motif. Reuses the same visual language as
// the passport-stamp page transition (PageStamp).
// Checkpoint 4 — distressed ink texture via the shared #stamp-grunge SVG
// filter (SvgFilters.jsx) instead of a perfectly clean vector border.
export default function Stamp({ label = 'RELIEVE · MX', className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-label uppercase tracking-wide text-xs
        border-2 border-sello-navy text-sello-navy rounded-full px-4 py-2 -rotate-6 ${className}`}
      style={{ filter: 'url(#stamp-grunge)' }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
