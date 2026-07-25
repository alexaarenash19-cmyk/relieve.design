---
doc: api.md
proyecto: Relieve — sitio web
version: 0.1
---

# API

REST/JSON. Sin auth para la tienda (guest). Endpoints admin protegidos con token. Precios en **centavos MXN** o enteros MXN (definir una convención; abajo uso enteros MXN).

## Catálogo (lectura)
### GET /api/collections
→ `[{ id, slug, name, photo_url }]`

### GET /api/places
Query: `?q=texto&collection=slug&size=code&frame=code&type=ciudad|montana`
Filtra y busca (para el buscador "Encuentra tu lugar" e índice A–Z).
→ `[{ slug, name, type, thumb_url, base_price, status }]`

### GET /api/places/:slug
→ `{ slug, name, type, lat, lng, elevation_m, story, aerial_url, model_url, thumb_url, base_price, status, reviews_count }`

## Precio (opcional; también puede calcularse en cliente)
### POST /api/pricing
Body: `{ size_code, frame_code, addons: ['capelo'] }`
→ `{ unit_price }`  (= sizes.price + frames.price_delta + Σ addons.price_delta)

## Checkout (Stripe)
### POST /api/checkout
Body:
```json
{
  "items": [
    { "place_slug":"monterrey", "custom_place":null, "size_code":"mediano",
      "frame_code":"nogal", "color_code":"blanco", "orientation":"horizontal",
      "plate_text":null, "capelo":false, "qty":1 }
  ],
  "is_gift": false,
  "gift_message": null,
  "email": "cliente@correo.com"
}
```
Servidor: valida ítems, recalcula precios (nunca confiar en el precio del cliente), crea **Stripe Checkout Session**:
- `mode: 'payment'`, `currency: 'mxn'`
- `line_items` desde los ítems (con nombre "Relieve · Monterrey · Mediano · Nogal")
- **payment_method_types:** `['card','oxxo']`; habilitar **MSI** (installments) en tarjeta
- `shipping_address_collection` (MX) + `shipping_options` por zona; envío incluido si subtotal > $2,500
- `metadata`: ítems serializados, is_gift, gift_message
- `success_url` / `cancel_url`
→ `{ url }` (redirigir el navegador)

## Webhook Stripe
### POST /api/webhooks/stripe  (firma verificada)
Evento `checkout.session.completed`:
1. Crea `order` (status `paid`, genera `number` y `status_token`) + `order_items` desde metadata.
2. Dispara n8n: `POST N8N_WEBHOOK_URL/order-paid` con el pedido.
Otros eventos: `payment_intent.payment_failed` → notificar; `checkout.session.expired` → limpiar.

## n8n (operaciones)
- **order-paid** → (a) **correos** (Resend): confirmación tipo boarding pass con resumen del pedido y link a `/pedido/:status_token`. Implementado: `n8n/workflows/order-paid-confirmation.json` (webhook, dispara con el `POST N8N_WEBHOOK_URL/order-paid` que ya manda `api/webhooks/stripe.js`). (b) **CFDI** vía Facturama (decidido en `decisions.md` #3), emitido "público en general" por defecto (no hay captura de datos fiscales en el checkout hoy); (c) **guía de envío** vía Envia.com → guarda `tracking_number`, pasa a `in_production`. **(b) y (c) no implementados aún** — ver plan detallado en `docs/superpowers/plans/2026-07-24-order-paid-cfdi-shipping-plan.md`, que documenta dos gaps reales de esquema (dimensiones/peso por `size_code`, dirección de origen del estudio) que bloquean el paso de envío independientemente de los detalles exactos de las APIs de Facturama/Envia.com.
- **order-shipped** (cron cada 20 min sobre `orders` con `status='shipped'` y sin `shipped_tracking_email_sent_at`) → email con rastreo. Implementado: `n8n/workflows/order-shipped.json`.
- **checkout-abandonado** (1–1.5h después de un checkout iniciado sin pago) → email de recuperación (Resend). Reemplaza el concepto de "carrito abandonado" real — ver PRD; no trackea agregados al carrito, solo intentos de checkout.
- **review-incentive** (7 días después de `delivered`) → cupón Stripe de un solo uso (10%, 30 días) + pedir reseña (Resend). Reemplaza el antiguo `review-request` de 2–3 días / issue #35.
- Todo lo "difuso" (redactar correos, avisos por Telegram, excepciones) puede pasar por un **agente LLM**; el flujo de dinero/estado va determinista.

## Waitlist
### POST /api/waitlist  `{ place_slug, size_code, email }` → 201
Cuando la pieza vuelve a `active`, n8n notifica a los `waitlist` no notificados.

## Reseñas
### GET /api/reviews?place=slug → `[{ customer, city, rating, photo_url, comment }]` (solo `approved`)
### POST /api/reviews (multipart: foto + campos) → 201 (queda `approved=false` hasta moderar)

## Seguimiento de pedido (magic link)
### GET /api/orders/:token
→ `{ number, status, tracking_number, items:[...], created_at }`  (sin login)

## Admin (token)
- `PATCH /api/admin/orders/:id` (cambiar status, subir tracking)
- `PATCH /api/admin/reviews/:id` (approve)
- `POST /api/admin/places` (alta de lugares/modelos)

## Convenciones
- Errores: `{ error: { code, message } }`, HTTP status correcto.
- Nunca poner datos personales en query strings.
- Idempotencia en el webhook (usar `stripe_session_id` para no duplicar órdenes).
