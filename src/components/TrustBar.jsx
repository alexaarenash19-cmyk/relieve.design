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
// 2026-08-10 — reversión explícita: el swap Home-only a la tira Cempasúchil
// "RELIEVE" (agregado en PR #167, hand-off §2/§3/§4 decisión #3) se quitó
// a petición directa de Ale ("regresa el banner de confianza azul... quita
// el banner naranja"). El ticker vuelve a mostrarse igual en todas las
// páginas, sin excepción de ruta.
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
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-7 overflow-hidden bg-brand-dark text-gallery-white">
      {/* Hallazgo (auditoría 10 ago 2026): el <div aria-hidden="true"> de
          abajo escondía info real de política (envío/devoluciones) de
          cualquier lector de pantalla en todas las páginas menos donde
          este mismo texto se repitiera en otro lado. El contenido
          duplicado del ticker (dos copias para el loop CSS sin salto) sí
          debe seguir oculto — se mantiene aria-hidden — pero una lista
          sr-only aparte, leída una sola vez, expone la información real. */}
      <ul className="sr-only">
        {ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="trust-ticker-track flex h-full items-center whitespace-nowrap font-label uppercase tracking-wide text-[11px]"
      >
        <TickerContent />
        <TickerContent />
      </div>
    </div>
  );
}
