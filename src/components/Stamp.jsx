// P3 — "sellos tipo migratorio" motif. Reuses the same visual language as
// the passport-stamp page transition (PageStamp), as a static decoration.
export default function Stamp({ label = 'RELIEVE · MX', className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center font-label uppercase tracking-wide text-xs
        border-2 border-navy text-navy rounded-full px-4 py-2 -rotate-6 ${className}`}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
