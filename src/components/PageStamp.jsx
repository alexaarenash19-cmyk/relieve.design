// Issue #43 — passport-stamp transition on route change. Purely CSS-driven
// (see .page-stamp in index.css) so prefers-reduced-motion can disable it
// globally with one media query, no JS branching needed.
//
// 14 ago 2026 — reemplazado el texto "RELIEVE · MX" (sello tipo migratorio,
// borde + filtro grunge) por el logomark nuevo de Ale, tal cual el archivo
// que mandó: el SVG ya trae el azul (#a5bcd6, el mismo --color-line) fijo
// en los paths, así que se ve igual en claro y oscuro sin ninguna variable
// de color — y sin fondo/borde/rotación de "sello", a pedido explícito.
import { useLocation } from 'react-router-dom';
import mark from '../assets/brand/mark.svg';

export default function PageStamp() {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="page-stamp" aria-hidden="true">
      <img src={mark} alt="" fetchPriority="high" className="page-stamp-mark" style={{ aspectRatio: '16 / 9' }} />
    </div>
  );
}
