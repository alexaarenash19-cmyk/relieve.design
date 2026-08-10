---
doc: api.md
proyecto: Relieve — sitio web
version: 0.2
---

# API

> Reescrito 10 ago 2026 contra el código real (`api/*.js`, `vercel.json`) —
> la v0.1 describía el diseño previo al lanzamiento; en particular
> documentaba `GET /api/collections`, que nunca se implementó, y varios
> endpoints cambiaron de forma real durante la implementación. En caso de
> conflicto con `docs/decisions.md`, decisions.md manda.

REST/JSON. Sin auth para la tienda (guest checkout). Endpoints admin
protegidos con `ADMIN_TOKEN` (`lib/adminAuth.js`, header
`Authorization: Bearer <token>`). **Todos los precios son enteros en
centavos MXN** (`_cents`), sin ambigüedad — la v0.1 dejaba esto como "por
definir".

Implementación: la mayoría de rutas de catálogo/checkout/reviews son en
realidad **una sola función serverless por archivo** (`api/catalog.js`,
`api/checkout.js`, `api/reviews.js`, `api/webhooks/stripe.js`,
`api/admin/[...path].js`) con `vercel.json` reescribiendo las URLs
"bonitas" hacia `?resource=X` — consolidado así para no chocar con el
límite de funciones del plan Hobby de Vercel (12), no una elección de
arquitectura de negocio.

## Catálogo (lectura)

### GET /api/places
Query: `?q=texto&type=ciudad|juego&series=origen|travesia|cumbre`
→ `[{ slug, name, type, series, thumb_url, base_price, status }]`
(`base_price` en la respuesta = `places.base_price_cents` renombrado, no una unidad distinta.)
`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` en éxito; `no-store` si cae a los datos placeholder (`lib/dummyCatalog.js`, cuando Supabase no responde). Excluye `status='draft'` siempre — nunca debe verse una pieza archivada aquí, ni siquiera consultando directo.

### GET /api/places/:slug
→ `{ slug, name, type, series, country, lat, lng, elevation_m, story, aerial_url, model_url, thumb_url, base_price, status, reviews_count }`

No existe `GET /api/collections` — la tabla `collections` es vestigial (ver `docs/database.md`); la taxonomía real es `type`/`series` sobre `places`.

## Precio
### POST /api/pricing
Body: `{ size_code, frame_code, addons: ['capelo'] }` (addons es opcional, default `[]` — ya no hay selector de addons en la UI de cliente)
→ `{ unit_price }` (centavos MXN — el nombre de la respuesta no lleva sufijo `_cents` pese a que sí lo es, inconsistencia menor conocida, no vale la pena romper el contrato solo por nombrarlo bien)
= `sizes.price_cents + frames.price_delta_cents + Σ addons.price_delta_cents`, calculado en `lib/pricing.js`. Si el catálogo de Supabase no responde, cae a un fallback hardcodeado (`lib/dummyCatalog.js`) en vez de fallar.

## Checkout (Stripe)
### POST /api/checkout
Body:
```json
{
  "items": [
    { "place_slug": "ciudad-de-mexico", "custom_place": null, "size_code": "mediano",
      "frame_code": "parota", "color_code": "blanco", "orientation": "horizontal",
      "plate_text": null, "memory_note": null, "capelo": false, "qty": 1 }
  ],
  "is_gift": false,
  "gift_message": null,
  "email": "cliente@correo.com"
}
```
Servidor (`api/checkout.js`): rate limit (`checkout`, 10/min por IP) → valida request → recalcula precios server-side (nunca confía en el precio del cliente) → **valida que cada `place_slug` esté en estado vendible** (`active`/`preorder`; rechaza `draft`/`soldout` con 400 `not_available` — hallazgo #6, auditoría 10 ago 2026, cerraba un hueco donde una llamada directa a la API podía comprar una pieza archivada aunque el frontend ya la filtrara) → **valida longitud de `memory_note`/`custom_place`/`plate_text`/`gift_message`** (límites conservadores no confirmados por Ale, ver comentario en el código) → crea **Stripe Checkout Session**:
- `mode: 'payment'`, `currency: 'mxn'`
- `payment_method_types: ['card', 'oxxo']`
- `shipping_address_collection` (solo `MX`) + `phone_number_collection` habilitado
- `metadata`: ítems serializados (fragmentados en `items_0`, `items_1`, ... — Stripe limita cada valor de metadata a 500 caracteres), `is_gift`, `gift_message`
- `success_url` con `{CHECKOUT_SESSION_ID}` / `cancel_url`
→ `{ url }` (redirigir el navegador)

Errores propios: `400 invalid_request` (faltan items/email), `400 <code de PricingError>` (place_slug/size_code/frame_code/color_code inválido, texto muy largo, pieza no vendible), `503 checkout_not_configured` (STRIPE_SECRET_KEY no seteada), `502 stripe_error` (Stripe rechazó la sesión).

No hay MSI/zonas de envío/`shipping_options` implementados en el código — la v0.1 de este doc los describía como parte del diseño original; no se llegaron a construir.

## Webhook Stripe
### POST /api/webhooks/stripe (firma verificada con `STRIPE_WEBHOOK_SECRET`)
Evento `checkout.session.completed` (`createOrderFromSession`):
1. Chequeo idempotente por `stripe_session_id` (además, la columna tiene `UNIQUE` desde 10 ago 2026 — un `23505` en el insert de `orders` se trata como "otra invocación concurrente ya ganó la carrera", no como error).
2. Inserta `order` (status `paid`, genera `number` y `status_token`).
3. Inserta `order_items` desde el metadata de la sesión — **si este insert falla, ahora lanza error (antes quedaba en silencio)**: Stripe reintenta el evento y se dispara una alerta interna (hallazgo #1, auditoría 10 ago 2026).
4. Envía los correos de confirmación (Ale + cliente) — best-effort, no tumba el webhook si fallan.
5. Dispara `POST N8N_WEBHOOK_URL/order-paid` si está configurado — best-effort.

Otros eventos: `payment_intent.payment_failed` → solo se loguea; `checkout.session.expired` → solo se loguea. Ninguno de los dos dispara acción adicional hoy.

## n8n (operaciones)
- **order-paid**: los correos de confirmación (Ale + cliente) **ya no dependen de n8n** — se implementaron directo en `lib/alerts.js` (vía Resend) porque los workflows de n8n nunca se conectaron a una instancia en vivo ("dispara y nadie contesta"). CFDI (Facturama) y guía de envío (Envia.com/Skydropx) siguen sin implementar — bloqueados por gaps de esquema reales (dimensiones/peso por `size_code`, dirección de origen), no solo por integración pendiente.
- **order-shipped**: correo de rastreo — tampoco depende de n8n, se envía directo desde `PATCH /api/admin/orders/:id` cuando Ale entra un `tracking_number` (`lib/alerts.js`'s `sendShippingNotice`).
- **checkout-abandonado** / **review-incentive**: estos dos **sí siguen dependiendo de una instancia de n8n en vivo** que no está confirmada como corriendo — si no lo está, el correo de recuperación de carrito y el cupón de reseña post-entrega simplemente no se envían, sin nada que lo detecte. Pendiente de verificar/implementar el mismo patrón de fallback directo que ya tienen order-paid/order-shipped.

## Waitlist
### POST /api/waitlist `{ place_slug, size_code, email }` → 201
Rate limit `waitlist`, 5/min por IP. Si Supabase no responde pero `place_slug` es una de las piezas del catálogo placeholder, acepta igual (201) sin persistir nada — mantiene el flujo probable sin exponer el fallo.

## Curva de nivel
### POST /api/curva-de-nivel `{ email }` → 201
Lista de correo a nivel sitio (no por pieza). Email duplicado no es error — la constraint `unique` en la tabla deduplica en silencio (`23505` tratado como éxito).

## Reseñas
### GET /api/reviews?place=slug
→ `[{ id, customer, city, rating, photo_url, comment }]` (solo `approved=true`)
`id` agregado 10 ago 2026 (antes el frontend usaba `customer + índice` como React key). Rate limit `reviews-get`, 30/min por IP, y `Cache-Control` igual que `/api/places` — ninguno de los dos existía antes de la auditoría del 10 ago 2026.

### POST /api/reviews (multipart: foto + campos) → 201
Queda `approved=false` hasta moderación manual. Rate limit `reviews-post`, 5/min por IP. La foto se valida por firma de bytes real (magic number), no por el `Content-Type` declarado por el cliente — evita que un archivo no-imagen etiquetado como `image/jpeg` se guarde.

## Seguimiento de pedido (magic link)
### GET /api/orders/:token
→ `{ number, status, tracking_number, created_at, items: [{ place_id, custom_place, size_code, frame_code, color_code, qty, unit_price_cents, piece_number, places: { name, series, country, type } }] }` — sin login.

### GET /api/orders/by-session/:sessionId
→ `{ status_token }` o `404` (transitorio esperado: el navegador llega aquí justo después de pagar, antes de que el webhook haya alcanzado a crear la orden — el frontend hace polling a través de esto, no es una condición de error real).

## Admin (`ADMIN_TOKEN`, header `Authorization: Bearer <token>`)
- `PATCH /api/admin/orders/:id` — body `{ status?, tracking_number? }`. `:id` acepta el id numérico de Supabase o el número humano (`RLV-YYYY-NNNNNN`). Entrar `tracking_number` sin `status` explícito setea `status='shipped'` automáticamente. Si trae `tracking_number`, dispara el correo de rastreo al cliente (best-effort).
- `PATCH /api/admin/reviews/:id` — body `{ approved? }` (default `true`).
- `POST /api/admin/places` — alta de lugares; requiere `slug`, `name`, `type`, `base_price_cents`.

Las tres rutas están consolidadas en un solo archivo (`api/admin/[...path].js`) para no exceder el límite de funciones del plan Hobby de Vercel.

## Convenciones
- Errores: `{ error: { code, message } }`. Códigos 5xx nunca exponen el mensaje real de Postgres/Supabase/Stripe al cliente (`lib/errors.js` lo loguea server-side y devuelve un mensaje genérico); códigos 4xx sí son mensajes propios, pensados para mostrarse.
- Nunca poner datos personales en query strings.
- Idempotencia en el webhook: `stripe_session_id` con constraint `UNIQUE` (no solo un chequeo previo no-atómico como antes del 10 ago 2026).
