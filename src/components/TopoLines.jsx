// P3 — "curvas de nivel" motif from ui-ux.md's Sistema gráfico ("el pasaporte
// de los lugares"). Concentric contour lines, pure SVG, no image asset.
export default function TopoLines({ className = '' }) {
  const radii = [40, 70, 100, 130, 160, 190];
  return (
    <svg
      className={`pointer-events-none ${className}`}
      viewBox="0 0 400 400"
      aria-hidden="true"
    >
      {radii.map((r, i) => (
        <ellipse
          key={r}
          cx="200"
          cy="200"
          rx={r}
          ry={r * 0.72}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.5 - i * 0.06}
        />
      ))}
    </svg>
  );
}
