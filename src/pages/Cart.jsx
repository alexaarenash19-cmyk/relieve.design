// Issue #55 — cart, styled as a boarding pass (Courier Prime, perforated edge).
// Rendered as a full page for now; slides in from a nav trigger once #42 (nav) exists.
// Issue #56 — checkout button posts to /api/checkout and redirects to Stripe.
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import Button from '../components/Button.jsx';

const FREE_SHIPPING_THRESHOLD_CENTS = 250000; // $2,500 MXN — api.md checkout rule

function money(cents) {
  return `$${(cents / 100).toLocaleString('es-MX')} MXN`;
}

export default function Cart() {
  const {
    items,
    subtotal_cents,
    isGift,
    giftMessage,
    removeItem,
    updateQty,
    setIsGift,
    setGiftMessage,
  } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotal_cents);
  const progress = Math.min(100, (subtotal_cents / FREE_SHIPPING_THRESHOLD_CENTS) * 100);

  const [email, setEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onCheckout() {
    setCheckoutError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, is_gift: isGift, gift_message: giftMessage || null, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'checkout_failed');
      window.location.href = data.url;
    } catch {
      setCheckoutError('No pudimos iniciar el pago. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-8">
      <div className="border border-line rounded-[9px] border-dashed p-6 font-label">
        <h1 className="uppercase tracking-wide text-lg mb-4">Tu carrito</h1>

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
                    className="normal-case font-body text-xs underline text-text/60"
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
          <p className="normal-case font-body text-xs mt-2 text-text/70">
            Te faltan {money(remaining)} para envío gratis.
          </p>
        ) : (
          <p className="normal-case font-body text-xs mt-2 text-sage">Envío gratis desbloqueado.</p>
        )}
        <div className="h-1 bg-line rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-navy" style={{ width: `${progress}%` }} />
        </div>

        <label className="flex items-center gap-2 mt-6 normal-case font-body text-sm">
          <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
          Es un regalo
        </label>
        {isGift && (
          <textarea
            className="w-full mt-2 border border-line rounded p-2 normal-case font-body text-sm"
            placeholder="Mensaje de regalo"
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
          />
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
            {checkoutError && (
              <p className="normal-case font-body text-xs text-red-700 mt-2">{checkoutError}</p>
            )}
            <Button
              onClick={onCheckout}
              disabled={loading || !email}
              className="w-full mt-3 normal-case font-label"
            >
              {loading ? 'Redirigiendo…' : 'Pagar'}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
