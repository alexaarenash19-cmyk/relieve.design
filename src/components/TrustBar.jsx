// docs/relieve-brand-brief.md sección 12 — trust bar en ticker/loop, en la
// parte superior del sitio (referencias: Nude Project, Walled Maps). No
// existía ningún componente de trust bar en el repo — esto es nuevo, no una
// edición de algo existente.
//
// Fixed encima de Nav.jsx (z-50 > Nav's z-40), altura fija de 28px — Nav
// se corrió de `top-0` a `top-7` (28px) para no quedar tapado debajo.
//
// El loop es CSS puro (sin JS/GSAP): el contenido se duplica una vez y una
// animation traslada -50% en X — como las dos mitades son idénticas, el
// punto -50% es visualmente indistinguible del inicio, así que el loop no
// tiene salto. prefers-reduced-motion detiene la animación (contenido
// estático, primera copia visible) en vez de forzar movimiento continuo.
//
// 2026-08-09 landing rebrand hand-off §2/§3/§4, decisión confirmada #3 —
// en Home ('/') este mismo slot (fixed top-0, z-50, h-7) se reemplaza por
// la tira Cempasúchil "RELIEVE" en vez del ticker; Nav ya vive en top-7
// así que no necesita ningún cambio. Cualquier otra página sigue mostrando
// el ticker normal, sin cambios.
import { useLocation } from 'react-router-dom';

const ITEMS = [
  'Envío gratis',
  'Envíos a toda la República',
  'Devolución gratuita — 7 días',
  'Hecho a mano en México',
];

function TickerContent() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center">
          {item}
          <span className="mx-6 opacity-50" aria-hidden="true">·</span>
        </span>
      ))}
    </>
  );
}

export default function TrustBar() {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return (
      <div
        className="fixed top-0 inset-x-0 z-50 h-7 flex items-center justify-center bg-cempasuchil text-grafito"
        aria-hidden="true"
      >
        <span className="font-label uppercase tracking-[0.3em] text-[11px] font-bold">
          Relieve
        </span>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 h-7 overflow-hidden bg-brand-dark text-gallery-white"
      aria-hidden="true"
    >
      <div className="trust-ticker-track flex h-full items-center whitespace-nowrap font-label uppercase tracking-wide text-[11px]">
        <TickerContent />
        <TickerContent />
      </div>
    </div>
  );
}
