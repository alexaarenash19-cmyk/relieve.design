// Checkpoint 2 — "etiquetas de archivo/baggage tags" as a real reusable
// component (was a CSS class applied ad hoc). Shows a spec label + value,
// styled as a luggage tag: punched hole, dashed border, Courier Prime.
export default function BaggageTag({ label, value, className = '' }) {
  return (
    <span
      className={`baggage-tag inline-flex flex-col border border-dashed border-line rounded pr-3 py-1 font-label uppercase tracking-wide text-xs ${className}`}
    >
      <span className="text-graphite/50 text-[10px]">{label}</span>
      <span>{value}</span>
    </span>
  );
}
