// Efecto 2 — Glass Order Summary Card (quick-buy, pre-checkout).
//
// Por qué esto NO es un formulario de tarjeta: Relieve usa Stripe Checkout
// hosteado, así que los campos de Card Number/Expiry/CVC del componente de
// referencia que Ale mandó no aplican — Stripe los captura en su propio
// dominio (checkout.stripe.com), nunca en este código. Lo que sí se porta:
// el look glass, la jerarquía visual y el botón de pago. Esta card es el
// resumen que el usuario ve en el sitio antes de mandarlo a Stripe — pieza,
// tamaño/marco, precio, y el botón que crea la sesión de Checkout.
//
// Flujo: quick-buy de una sola pieza (bypassa el carrito) — Product.jsx abre
// esta card dentro de un <dialog> con un botón "Comprar ahora", mismo
// patrón que WaitlistDialog.jsx (ref + showModal()/close()). Reutiliza el
// contrato exacto de POST /api/checkout que ya usa CartDrawer.jsx
// (items/email/is_gift/gift_message, mismos estados de loading/error/
// checkout_not_configured) — un solo item en el array en vez del carrito
// completo. El precio que se muestra aquí es solo para UI: api/checkout.js
// lo recalcula server-side a partir de size_code/frame_code, nunca confía
// en unit_price_cents del cliente.
//
// TRADUCCIÓN DEL ORIGINAL (componente de referencia de Ale):
// - framer-motion → orderSummaryCardEnter (lib/animations.js), ya en el
//   stack GSAP del repo y con guard de prefers-reduced-motion (el original
//   no tenía uno).
// - Card/Button/Input/Label de shadcn → markup + Tailwind plano; el repo no
//   tiene shadcn instalado.
// - Colores hardcodeados (--relieve-ink/--relieve-accent/--relieve-bg) →
//   tokens reales de src/index.css. El accent de hover/borde usa
//   --color-brand-dark (Sceptre Red, el único acento del sitio desde el
//   14 ago 2026 — cempasúchil, que este comentario mencionaba antes, se
//   retiró; ver su nota en index.css).
// - `backdrop-blur-md` genérico → clase .glass-card (index.css), misma
//   receta Liquid Glass que .pill-glass/.pill-glass-active (blur 20px +
//   saturate 180% + highlight superior + variante sin blur para
//   prefers-reduced-transparency) en vez de una segunda variante de
//   "glass" con otros valores.
// - `$price.toFixed(2)` en USD suelto → RollingPrice (mismo componente que
//   ya usa Product.jsx), MXN con formato es-MX.
//
// `item` trae la misma forma que Product.jsx ya arma para addItem()
// (place_slug, name, unit_price_cents, qty, size_code, frame_code,
// color_code, orientation, memory_note) — se reusa el mismo objeto para
// ambos flujos (agregar al carrito / comprar ahora).
import { useEffect, useRef, useState } from 'react';
import { orderSummaryCardEnter } from '../lib/animations.js';
import RollingPrice from './RollingPrice.jsx';
import Button from './Button.jsx';

export default function GlassOrderSummaryCard({ item, imageUrl, onClose, className = '' }) {
  const cardRef = useRef(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  // Distinto de checkoutError, mismo criterio que CartDrawer.jsx: "no
  // configurado" no es un fallo transitorio que valga la pena reintentar.
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  useEffect(() => {
    orderSummaryCardEnter(cardRef.current);
  }, []);

  async function onCheckout(e) {
    e.preventDefault();
    setCheckoutError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              place_slug: item.place_slug,
              size_code: item.size_code,
              frame_code: item.frame_code,
              color_code: item.color_code,
              orientation: item.orientation,
              memory_note: item.memory_note || null,
              qty: item.qty ?? 1,
            },
          ],
          is_gift: false,
          gift_message: null,
          email,
        }),
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
    <div ref={cardRef} className={`glass-card w-full max-w-[400px] rounded-[9px] p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="font-heading font-bold text-graphite">Resumen de tu pieza</h3>
        <p className="text-sm text-graphite/60">Revisa los detalles antes de pagar</p>
      </div>

      {imageUrl && (
        <div className="mb-6 aspect-square w-full overflow-hidden rounded-[9px] bg-graphite/5">
          <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="border-t border-line pt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-graphite">{item.name}</p>
          <RollingPrice
            cents={item.unit_price_cents * (item.qty ?? 1)}
            className="text-sm font-medium text-graphite whitespace-nowrap"
          />
        </div>
      </div>

      <form onSubmit={onCheckout}>
        <label htmlFor="quickbuy-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="quickbuy-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full mt-6 border border-line rounded px-3 py-2 text-sm"
        />
        {!email && <p className="text-xs text-graphite/60 mt-2">Ingresa tu correo para continuar al pago.</p>}
        {checkoutError && <p className="text-xs text-red-700 mt-2">{checkoutError}</p>}

        {checkoutUnavailable ? (
          <p className="text-xs text-graphite/60 mt-3 border border-line rounded p-2 text-center">
            Checkout en configuración — vuelve pronto.
          </p>
        ) : (
          <Button type="submit" disabled={loading || !email} className="w-full mt-3">
            {loading ? 'Redirigiendo…' : 'Pagar'}
          </Button>
        )}
      </form>

      {onClose && (
        <button type="button" onClick={onClose} className="w-full mt-2 text-xs text-graphite/60 underline">
          Cancelar
        </button>
      )}

      <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-graphite/50">
        🔒 Pago seguro procesado por Stripe
      </p>
    </div>
  );
}
