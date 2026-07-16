// Issue #43 — passport-stamp transition on route change. Purely CSS-driven
// (see .page-stamp in index.css) so prefers-reduced-motion can disable it
// globally with one media query, no JS branching needed.
import { useLocation } from 'react-router-dom';

export default function PageStamp() {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="page-stamp" aria-hidden="true">
      <span>RELIEVE · MX</span>
    </div>
  );
}
