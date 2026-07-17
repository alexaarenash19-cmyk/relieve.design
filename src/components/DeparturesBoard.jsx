// Checkpoint 2 — "tablero de salidas" as a reusable component for listing
// catalog rows (was one-off markup in Search). Courier Prime, uppercase,
// each row flaps in on mount like a split-flap board (staggered, respects
// prefers-reduced-motion via the shared .flap-row CSS).
export default function DeparturesBoard({ rows, emptyLabel = 'Sin resultados.' }) {
  if (rows.length === 0) {
    return <p className="text-graphite/60">{emptyLabel}</p>;
  }

  return (
    <ul className="border-t border-line font-label">
      {rows.map((row, i) => (
        <li
          key={row.key}
          className="flap-row border-b border-line"
          style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
        >
          {row.node}
        </li>
      ))}
    </ul>
  );
}
