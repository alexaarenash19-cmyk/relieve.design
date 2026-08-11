// Museográfico pass (11 ago 2026) — re-homed version of the "NN — Título"
// numbered-index convention (previously PageKicker, local to
// PassportFlipbook.jsx, which is being removed as part of the passport ->
// museográfico direction change). Scaled up for a full-screen nav list
// instead of a small in-page section kicker: bigger display type for the
// label, same mono/uppercase number prefix and hairline-divider idiom
// FichaTecnica.jsx and the rest of the site already use for label/value
// pairs. Single accent color on hover (cempasúchil), per the
// museográfico principle of one accent max, never a new decorative color.
import { Link } from 'react-router-dom';

export default function IndexRow({ n, label, path, onNavigate }) {
  return (
    <Link
      to={path}
      onClick={onNavigate}
      className="group flex items-baseline gap-4 py-4 border-b border-line hover:text-cempasuchil transition-colors"
    >
      <span className="font-label uppercase tracking-wide text-xs text-graphite/40 shrink-0 group-hover:text-cempasuchil transition-colors">
        {String(n).padStart(2, '0')} —
      </span>
      <span className="font-display text-2xl md:text-4xl">{label}</span>
    </Link>
  );
}
