// P2 — cart as a slide-out drawer, boarding-pass styled (Courier Prime,
// perforated edge), per ui-ux.md "Carrito: drawer estilo boarding pass".
// Replaces the old full-page /carrito.
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import Button from './Button.jsx';

const FREE_SHIPPING_THRESHOLD_CENTS = 250000; // $2,500 MXN — api.md checkout rule

function money(cents) {
  return `$${(cents / 100).toLocaleString('es-MX')} MXN`;
}

export default function CartDrawer() {
  const {
    items,
    subtotal_cents,
    isGift,
    giftMessage,
    removeItem,
    updateQty,
    setIsGift,
    setGiftMessage,
    isOpen,
    closeCart,
  } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotal_cents);
  const progress = Math.min(100, (subtotal_cents / FREE_SHIPPING_THRESHOLD_CENTS) * 100);

  const [email, setEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  // Distinct from checkoutError: "not configured" isn't a transient
  // failure worth retrying, so it gets its own calm, permanent message
  // instead of "algo salió mal, intenta de nuevo" — which would just send
  // people into a loop clicking a button that will never work yet.
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape') closeCart();
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [closeCart]);

  async function onCheckout() {
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
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-gallery-white overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="boarding-pass-edge ml-4 min-h-full p-6 font-label">
          <div className="flex justify-between items-center mb-4">
            <h2 className="uppercase tracking-wide text-lg">Tu carrito</h2>
            <button onClick={closeCart} aria-label="Cerrar carrito" className="text-xl leading-none">
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
                        className="w-6 h-6 border border-line rounded"
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        aria-label="Aumentar cantidad"
                        className="w-6 h-6 border border-line rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p>{money(item.unit_price_cents * item.qty)}</p>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="normal-case font-body text-xs underline text-graphite/60"
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
            <>
              <input
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
                  onClick={onCheckout}
                  disabled={loading || !email}
                  className="w-full mt-3 normal-case font-label"
                >
                  {loading ? 'Redirigiendo…' : 'Pagar'}
                </Button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
