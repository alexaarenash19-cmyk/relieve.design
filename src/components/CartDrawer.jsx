// P2 — cart as a slide-out drawer, boarding-pass styled (Courier Prime,
// perforated edge), per ui-ux.md "Carrito: drawer estilo boarding pass".
// Replaces the old full-page /carrito.
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useCart } from '../context/CartContext.jsx';
import { useEscapeKey } from '../lib/useEscapeKey.js';
import Button from './Button.jsx';

const FREE_SHIPPING_THRESHOLD_CENTS = 250000; // $2,500 MXN — api.md checkout rule
// Hallazgo (auditoría 10 ago 2026): storage propio, separado de
// CartContext's STORAGE_KEY — ver el comentario en CartContext.jsx sobre
// por qué giftMessage salió del contexto compartido.
const GIFT_MESSAGE_KEY = 'relieve_cart_gift_message';

// apple-design audit (14 ago 2026, §4/§12) — arrastrar para cerrar, mismo
// patrón de umbral+captura+velocidad que Gallery.jsx ya usa para el canvas
// (setPointerCapture, ventana de 2 muestras, decidir por velocidad además
// de posición — §5/§6), aplicado a un sheet en vez de un canvas infinito.
// Solo se arrastra hacia la derecha (por donde entró, §7); el umbral exige
// movimiento predominantemente horizontal para no robarle el scroll
// vertical de la lista de items, y se ignora por completo si el gesto
// arranca sobre un control real (evita pelear con los botones +/-/Quitar/
// Pagar o los campos de texto).
const DRAG_THRESHOLD_PX = 10;
const DISMISS_DISTANCE_RATIO = 0.35; // arrastrar >35% del ancho cierra
const DISMISS_VELOCITY_PX_S = 500; // un flick rápido cierra aunque no llegue al 35%

function money(cents) {
  return `$${(cents / 100).toLocaleString('es-MX')} MXN`;
}

export default function CartDrawer() {
  const {
    items,
    subtotal_cents,
    isGift,
    removeItem,
    updateQty,
    setIsGift,
    isOpen,
    closeCart,
  } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotal_cents);
  const progress = Math.min(100, (subtotal_cents / FREE_SHIPPING_THRESHOLD_CENTS) * 100);

  // Solo este componente lee/escribe giftMessage — sacarlo de CartContext
  // (auditoría 10 ago 2026) es lo que de verdad evita que cada tecla acá
  // re-renderice a Nav.jsx y al resto de consumidores de useCart().
  const [giftMessage, setGiftMessage] = useState(() => {
    try {
      return localStorage.getItem(GIFT_MESSAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(GIFT_MESSAGE_KEY, giftMessage);
    } catch {
      // Same "private mode disables storage" tolerance as loadInitial in
      // CartContext.jsx — a lost draft note isn't worth a crash.
    }
  }, [giftMessage]);

  const [email, setEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  // Distinct from checkoutError: "not configured" isn't a transient
  // failure worth retrying, so it gets its own calm, permanent message
  // instead of "algo salió mal, intenta de nuevo" — which would just send
  // people into a loop clicking a button that will never work yet.
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEscapeKey(closeCart);

  // Arrastrar para cerrar — ver nota apple-design audit arriba del archivo.
  const asideRef = useRef(null);
  const draggingRef = useRef(false);
  const committedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef([]);

  function clearDragStyle() {
    const el = asideRef.current;
    if (!el) return;
    el.style.transform = '';
    el.style.transition = '';
  }

  // Cualquier style inline que haya quedado de un cierre por arrastre se
  // limpia la próxima vez que el drawer abre, antes de que la clase
  // translate-x-0 + transition-transform vuelva a tomar el control — sin
  // esto, un transform inline viejo bloquearía la animación de apertura
  // por completo (un inline style le gana a las clases).
  useEffect(() => {
    if (isOpen) clearDragStyle();
  }, [isOpen]);

  useEffect(() => () => gsap.killTweensOf(asideRef.current), []);

  function onDrawerPointerDown(e) {
    // Un gesto que arranca sobre un control real (botones +/-/Quitar/Pagar,
    // el checkbox, los campos de texto) nunca se interpreta como "arrastrar
    // para cerrar" — solo el fondo/chrome del drawer.
    if (e.target.closest('button, a, input, textarea, select')) return;
    gsap.killTweensOf(asideRef.current); // agarrar de nuevo a medio-cierre lo interrumpe limpio (§3)
    draggingRef.current = true;
    committedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    historyRef.current = [{ x: e.clientX, t: performance.now() }];
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // same tolerance as Gallery.jsx's canvas drag — capture is a
      // robustness improvement, not a requirement.
    }
  }

  function onDrawerPointerMove(e) {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!committedRef.current) {
      // Mismo umbral de 6-10px que Gallery.jsx antes de comprometerse al
      // gesto, más una comprobación de dirección: si el movimiento vertical
      // ya supera al horizontal, es un scroll de la lista, no un cierre.
      if (Math.abs(dx) < DRAG_THRESHOLD_PX || Math.abs(dy) > Math.abs(dx)) return;
      committedRef.current = true;
      const el = asideRef.current;
      if (el) el.style.transition = 'none'; // 1:1 con el dedo mientras se arrastra (§2)
    }

    const clamped = Math.max(0, dx); // solo hacia la derecha, por donde entró (§7)
    const el = asideRef.current;
    if (el) el.style.transform = `translate3d(${clamped}px, 0, 0)`;

    const history = historyRef.current;
    history.push({ x: e.clientX, t: performance.now() });
    if (history.length > 2) history.shift();
  }

  function onDrawerPointerUp(e) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!committedRef.current) return; // fue un click normal sobre el fondo, no un arrastre

    const el = asideRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width;
    const dx = Math.max(0, e.clientX - startRef.current.x);
    const history = historyRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let velocity = 0;
    if (!reduced && history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0) velocity = (last.x - first.x) / dt;
    }

    // Decide por velocidad, no solo posición (§5/§6): un flick rápido
    // cierra aunque no haya recorrido el 35% del ancho; un arrastre lento
    // que sí pasó el umbral de distancia también cierra.
    const shouldDismiss = width > 0 && (dx / width > DISMISS_DISTANCE_RATIO || velocity > DISMISS_VELOCITY_PX_S);

    if (shouldDismiss) {
      // Velocity handoff (§5): la animación de salida continúa a la
      // velocidad real del gesto en vez de una duración fija adivinada.
      const duration = reduced ? 0.01 : Math.max(0.1, (width - dx) / Math.max(velocity, 600));
      gsap.to(el, {
        x: width,
        duration,
        ease: 'power1.out',
        // No se limpia el style inline aquí a propósito: en este instante
        // isOpen todavía es true en React (closeCart() recién dispara el
        // cambio), y la clase translate-x-0 seguiría activa un frame antes
        // de que el re-render la reemplace por translate-x-full — limpiar
        // el transform inline justo ahí haría que el drawer regresara a
        // la vista de golpe por ese frame. translate3d(width,0,0) ya
        // coincide visualmente con translate-x-full, así que no hace
        // falta — el useEffect de abajo limpia el style inline la próxima
        // vez que isOpen vuelva a true, antes de la animación de apertura.
        onComplete: closeCart,
      });
    } else {
      gsap.to(el, {
        x: 0,
        duration: reduced ? 0.01 : 0.3,
        ease: 'power2.out',
        onComplete: clearDragStyle,
      });
    }
  }

  async function onCheckout(e) {
    e.preventDefault();
    setCheckoutError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, is_gift: isGift, gift_message: giftMessage || null, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data.error?.code === 'checkout_not_configured') {
        setCheckoutUnavailable(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data.error?.message ?? 'checkout_failed');
      window.location.href = data.url;
    } catch {
      setCheckoutError('No pudimos iniciar el pago. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 bg-graphite/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Carrito"
        aria-hidden={!isOpen}
        // Hallazgo (auditoría 10 ago 2026): aria-hidden solo no basta —
        // las WAI-ARIA Authoring Practices lo prohíben explícitamente
        // cuando el contenido oculto sigue teniendo elementos tabulables
        // (los botones +/-/Quitar/Pagar de aquí adentro). inert (soportado
        // nativamente, React lo pasa como boolean prop) saca todo el
        // subárbol del orden de tabulación y de la búsqueda de foco
        // mientras el drawer está cerrado, sin tener que desmontar el
        // contenido.
        inert={!isOpen}
        ref={asideRef}
        onPointerDown={onDrawerPointerDown}
        onPointerMove={onDrawerPointerMove}
        onPointerUp={onDrawerPointerUp}
        onPointerCancel={onDrawerPointerUp}
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-gallery-white overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="boarding-pass-edge ml-4 min-h-full p-6 font-label">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-brand-dark uppercase tracking-wide text-lg">Tu carrito</h2>
            <button onClick={closeCart} aria-label="Cerrar carrito" className="font-heading font-bold text-brand-dark text-xl leading-none">
              ×
            </button>
          </div>

          {items.length === 0 ? (
            <p className="normal-case font-body">Tu carrito está vacío.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.key} className="flex justify-between items-center border-b border-line pb-3">
                  <div>
                    <p className="uppercase tracking-wide text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1 normal-case font-body text-sm">
                      <button
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        aria-label="Reducir cantidad"
                        className="w-6 h-6 border border-line rounded font-heading font-bold text-brand-dark"
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        aria-label="Aumentar cantidad"
                        className="w-6 h-6 border border-line rounded font-heading font-bold text-brand-dark"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p>{money(item.unit_price_cents * item.qty)}</p>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="normal-case font-heading font-bold text-xs underline text-brand-dark"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 pt-4 border-t border-line flex justify-between uppercase tracking-wide">
            <span>Subtotal</span>
            <span className="font-bold">{money(subtotal_cents)}</span>
          </div>

          {remaining > 0 ? (
            <p className="normal-case font-body text-xs mt-2 text-graphite/70">
              Agrega {money(remaining)} más y tu envío queda incluido, como en el resto de la colección.
            </p>
          ) : (
            <p className="normal-case font-body text-xs mt-2 text-sage">Envío incluido en piezas de colección.</p>
          )}
          <div className="h-1 bg-line rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-sello-navy" style={{ width: `${progress}%` }} />
          </div>

          <label className="flex items-center gap-2 mt-6 normal-case font-body text-sm">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="appearance-none w-5 h-5 rounded border border-line bg-gallery-white relative cursor-pointer checked:bg-sello-navy checked:border-sello-navy after:content-[''] after:absolute after:inset-0 after:flex after:items-center after:justify-center checked:after:content-['✓'] after:text-dark-bg after:text-xs"
            />
            Es un regalo
          </label>
          {isGift && (
            <>
              <textarea
                className="w-full mt-2 border border-line rounded p-2 normal-case font-body text-sm"
                placeholder="Mensaje de regalo"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
              />
              <p className="normal-case font-body text-xs text-graphite/60 mt-2">
                ¿Se envía directo al destinatario? Escribe su dirección en el envío al pagar — no tiene que coincidir con la tuya.
              </p>
            </>
          )}

          {items.length > 0 && (
            // Hallazgo (auditoría 10 ago 2026): no había <form>, así que
            // Enter en el campo de correo no confirmaba el pago, a
            // diferencia de WaitlistDialog.jsx/AdminShip.jsx.
            <form onSubmit={onCheckout}>
              <label htmlFor="cart-email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="cart-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full mt-6 border border-line rounded p-2 normal-case font-body text-sm"
              />
              {/* The Pagar button below silently disables without this —
                  confirmed live: after a page refresh (email is plain
                  useState, not persisted) the button just sat there doing
                  nothing with no indication why. */}
              {!email && (
                <p className="normal-case font-body text-xs text-graphite/60 mt-2">
                  Ingresa tu correo para continuar al pago.
                </p>
              )}
              {checkoutError && (
                <p className="normal-case font-body text-xs text-red-700 mt-2">{checkoutError}</p>
              )}
              {checkoutUnavailable ? (
                <p className="normal-case font-body text-xs text-graphite/60 mt-3 border border-line rounded p-2 text-center">
                  Checkout en configuración — vuelve pronto.
                </p>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full mt-3 normal-case"
                >
                  {loading ? 'Redirigiendo…' : 'Pagar'}
                </Button>
              )}
            </form>
          )}
        </div>
      </aside>
    </>
  );
}