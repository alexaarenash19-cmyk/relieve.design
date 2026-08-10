---
doc: database.md
proyecto: Relieve — sitio web
motor: PostgreSQL (Supabase)
version: 0.2
---

# Base de datos

> Reescrito 10 ago 2026 contra el esquema real (migraciones en
> `supabase/migrations/`) y el código que lo usa — la v0.1 de este archivo
> describía el diseño previo al lanzamiento y se había desactualizado en
> varios puntos concretos (tipos, nombres de columna, tablas enteras sin
> documentar). En caso de conflicto entre este archivo y
> `docs/decisions.md`, **decisions.md manda** (es la fuente de verdad de
> negocio); este archivo describe el esquema tal como existe en código.

## Principios
- **Made-to-order:** no se controla stock por unidad; cada pieza se produce al pedido.
- **Guest checkout:** no hay tabla de usuarios/clientes con login; el pedido se identifica por correo + `status_token` (magic link, `/pedido/:token`).
- **Coordenadas reales** por lugar (nunca inventadas). Si no se tienen, quedan `NULL`.
- **Todos los campos de precio son enteros en centavos MXN** (sufijo `_cents`) — decisions.md §4, evita errores de punto flotante y coincide con la unidad mínima que usa Stripe.
- Las opciones (tamaño, marco, color, add-ons) son **catálogos** + reglas de precio, no un SKU por combinación.

## Tablas

### places (la pieza/lugar: ciudad o "juego" — puzzle)
```sql
CREATE TABLE places (
  id            SERIAL PRIMARY KEY,
  collection_id INT REFERENCES collections(id),  -- vestigial, ver nota abajo
  slug          TEXT UNIQUE NOT NULL,             -- 'ciudad-de-mexico'
  name          TEXT NOT NULL,                    -- 'Ciudad de México'
  type          TEXT CHECK (type IN ('ciudad','juego')) NOT NULL,
  series        TEXT CHECK (series IN ('origen','travesia','cumbre')),  -- ver nota abajo
  country       TEXT DEFAULT 'MX',
  lat           NUMERIC(9,6),               -- coordenadas reales o NULL
  lng           NUMERIC(9,6),
  elevation_m   INT,                        -- msnm, cuando aplica
  story         TEXT,                       -- historia editorial del lugar
  aerial_url    TEXT,
  model_url     TEXT,                       -- GLB (Draco) del relieve
  thumb_url     TEXT,                       -- foto vista superior con marco (galería)
  base_price_cents INT NOT NULL,            -- precio base en centavos MXN
  status        TEXT CHECK (status IN ('active','soldout','preorder','draft')) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now()
);
```
- `type` real son solo dos valores (`ciudad` para piezas de pared, `juego` para el puzzle) — no `estadio`/`f1`/`mexico`/`montana` como decía la v0.1 de este doc; esos eran del catálogo de desarrollo, retirado en la limpieza de catálogo de 6 piezas (2026-07-27).
- `series` (agregada 2026-08-06) agrupa por naturaleza del lugar para `/colecciones`: **Origen** = ciudades dentro de México, **Travesía** = ciudades fuera de México, **Cumbre** = montañas/picos. No se deriva de `type`/`country` — es su propia columna porque una pieza de montaña vendida como pieza de pared tendría `type='ciudad'` en la forma pero seguiría siendo conceptualmente "Cumbre".
- `status`: `draft` es cómo se archiva una pieza que no se puede borrar del todo (tiene `order_items`/`reviews`/`waitlist` que la referencian) — nunca debe aparecer en el catálogo público. `soldout` sí se muestra (empuja a `WaitlistDialog`), `preorder` es vendible por definición. `api/checkout.js` valida esto server-side (hallazgo #6, auditoría 10 ago 2026) — no basta con que el frontend filtre `draft` del catálogo.
- `collection_id` → `collections` es **vestigial**: la tabla `collections` no se usa como mecanismo de agrupación real (confirmado por el propio comentario de `api/catalog.js`); la taxonomía real vive en `type`/`series`.

### collections (vestigial — no usar como mecanismo de agrupación)
```sql
CREATE TABLE collections (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  photo_url    TEXT,
  sort         INT DEFAULT 0,
  active       BOOLEAN DEFAULT TRUE
);
```
Sigue existiendo por la FK legacy de `places.collection_id`, pero `api/catalog.js` no la consulta para armar el catálogo — eso lo hace `places.type`/`places.series`. No reintroducir esta tabla como fuente de agrupación sin antes revisar si `catalog.js` realmente la usa.

### Catálogos de personalización (precio en centavos MXN; delta suma sobre base)
```sql
CREATE TABLE sizes (
  code TEXT PRIMARY KEY,        -- 'chico','mediano','grande','especial','puzzle'
  label TEXT,
  price_cents INT,              -- precio absoluto del tamaño
  dims TEXT,
  sort INT
);
CREATE TABLE frames (
  code TEXT PRIMARY KEY,        -- 'parota','roble','negro' ('nogal' descontinuado, columna se queda por integridad de FK de pedidos viejos)
  label TEXT,
  price_delta_cents INT DEFAULT 0,
  sort INT
);
CREATE TABLE colors (
  code  TEXT PRIMARY KEY,       -- 'terracota' descontinuado del selector, misma razón que 'nogal'
  label TEXT,
  hex   TEXT,
  sort  INT
);
CREATE TABLE addons (
  code  TEXT PRIMARY KEY,       -- 'capelo','placa' — descontinuados de la UI de cliente (brand-brief.md §16 decisión 5), columnas se quedan por integridad de FK
  label TEXT,
  price_delta_cents INT DEFAULT 0
);
```
> Precio de una pieza = `sizes.price_cents` + `frames.price_delta_cents` + `addons` seleccionados (`lib/pricing.js`). `colors` no altera precio. `orientation` (`'horizontal'`/`'vertical'`) no altera precio.

### orders
```sql
CREATE TABLE orders (
  id                     SERIAL PRIMARY KEY,
  number                 TEXT UNIQUE NOT NULL,      -- 'RLV-2026-000123'
  email                  TEXT NOT NULL,
  status                 TEXT CHECK (status IN ('paid','in_production','shipped','delivered','cancelled')) DEFAULT 'paid',
  currency               TEXT DEFAULT 'MXN',
  subtotal_cents         INT NOT NULL,
  shipping_cents         INT DEFAULT 0,
  total_cents            INT NOT NULL,
  is_gift                BOOLEAN DEFAULT FALSE,
  gift_message           TEXT,
  shipping_address       JSONB,                      -- objeto de dirección de Stripe Checkout
  stripe_session_id      TEXT UNIQUE,                 -- UNIQUE desde 10 ago 2026 (hallazgo #7 auditoría — evita pedidos duplicados por reintento/concurrencia de Stripe)
  cfdi_uuid              TEXT,                        -- folio fiscal (n8n lo llena)
  tracking_number        TEXT,
  status_token           TEXT UNIQUE,                 -- magic link /pedido/:token
  delivered_at           TIMESTAMPTZ,                  -- seteado automático por trigger cuando status pasa a 'delivered'
  review_coupon_sent_at  TIMESTAMPTZ,
  shipped_tracking_email_sent_at TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now()
);
```
- `delivered_at` se llena solo (trigger `orders_set_delivered_at`) — ningún código que haga `PATCH` del status necesita acordarse de setearlo a mano.
- `review_coupon_sent_at`/`shipped_tracking_email_sent_at` respaldan flujos de n8n tipo cron-poll (este repo no tiene webhook propio para "cambió el status de un pedido", solo para `checkout.session.completed` de Stripe).

### order_items
```sql
CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT REFERENCES orders(id) ON DELETE CASCADE,
  place_id      INT REFERENCES places(id),
  custom_place  TEXT,                 -- ubicación personalizada (si no está en catálogo)
  size_code     TEXT REFERENCES sizes(code),
  frame_code    TEXT REFERENCES frames(code),
  color_code    TEXT REFERENCES colors(code),
  orientation   TEXT DEFAULT 'horizontal',
  plate_text    TEXT,                 -- grabado opcional (addon descontinuado de la UI)
  memory_note   TEXT,                 -- "en una frase, ¿por qué este lugar?" — se imprime en tarjeta física
  capelo        BOOLEAN DEFAULT FALSE,
  unit_price_cents INT NOT NULL,
  qty           INT DEFAULT 1,
  piece_number  INT DEFAULT nextval('piece_number_seq')  -- número de pieza/edición, secuencia global asignada al pagar
);
```
- `piece_number` se asigna vía `DEFAULT nextval(...)`, no en el webhook — la única vía que inserta en esta tabla (`createOrderFromSession`, `api/webhooks/stripe.js`) solo corre para pedidos ya pagados, así que el `DEFAULT` logra "asignar en el momento del pago" sin lógica extra.

### reviews
```sql
CREATE TABLE reviews (
  id           SERIAL PRIMARY KEY,
  place_id     INT REFERENCES places(id),
  customer     TEXT,
  city         TEXT,
  rating       INT CHECK (rating BETWEEN 1 AND 5),
  photo_url    TEXT,                  -- obligatoria en la práctica: brief Rayo X exige nombre+ciudad+foto, nunca solo estrellas
  comment      TEXT,
  approved     BOOLEAN DEFAULT FALSE, -- moderación manual antes de aparecer en /pieza/:slug
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### waitlist (piezas agotadas, por pieza)
```sql
CREATE TABLE waitlist (
  id         SERIAL PRIMARY KEY,
  place_id   INT REFERENCES places(id),
  size_code  TEXT,
  email      TEXT NOT NULL,
  notified   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### curva_de_nivel (lista de correo a nivel sitio, no por pieza)
```sql
CREATE TABLE curva_de_nivel (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,     -- unique: reintento/doble-click no debe duplicar
  created_at TIMESTAMPTZ DEFAULT now()
);
```
brand-brief.md §16 decisión 9 — sin `place_id` a propósito, a diferencia de `waitlist`.

### carts (snapshot de intento de checkout, para recuperación de carrito abandonado)
```sql
CREATE TABLE carts (
  id                    SERIAL PRIMARY KEY,
  email                 TEXT,
  items                 JSONB NOT NULL,   -- snapshot: [{place_id, place_slug, custom_place, size_code, frame_code, color_code, orientation, plate_text, capelo, qty, unit_price_cents}]
  subtotal_cents        INT NOT NULL,
  stripe_session_id     TEXT,
  purchase_completed    BOOLEAN DEFAULT FALSE,
  abandoned_email_sent  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```
Se inserta al crear la sesión de Stripe (`api/checkout.js`, fire-and-forget, no bloquea el redirect a pagar) y se marca `purchase_completed = true` desde el webhook cuando el pago se confirma. Respalda el workflow de n8n `checkout-abandonado.json`.

### rate_limit_hits (rate limiting propio, sin Redis)
```sql
CREATE TABLE rate_limit_hits (
  id          SERIAL PRIMARY KEY,
  bucket_key  TEXT NOT NULL,   -- '{endpoint}:{ip}', ver lib/rateLimit.js
  created_at  TIMESTAMPTZ DEFAULT now()
);
```
Ventana deslizante consultada por `lib/rateLimit.js` — fail-open si la consulta a esta tabla falla (una caída de Supabase no debe tumbar tráfico real). Existe `cleanup_old_rate_limit_hits()` (borra filas >1 día) pero **no hay ningún cron real que la llame todavía** — pendiente (Vercel Cron o `pg_cron`, no confirmado disponible en el plan de Supabase actual).

## RLS (Row Level Security)
Todas las tablas listadas arriba tienen RLS activado, sin políticas para `anon`/`authenticated` — el único acceso real pasa por `/api/*` server-side con `SUPABASE_SERVICE_KEY`, que evade RLS por diseño. `curva_de_nivel`/`rate_limit_hits` (creadas después del lockdown general del 2026-07-24) tienen su propio `ENABLE ROW LEVEL SECURITY` explícito en su propia migración. **`carts` no tiene un `ENABLE ROW LEVEL SECURITY` explícito confirmado en su migración** — verificar contra el estado vivo de la base antes de asumir que está protegida igual que el resto (hallazgo pendiente de la auditoría 10 ago 2026, no resuelto en este PR por falta de acceso a la DB en vivo).

## Notas
- El **número de pedido** y el `status_token` se generan al crear la orden (webhook de Stripe, `api/webhooks/stripe.js`).
- Estados del pedido: `paid → in_production → shipped → delivered` (o `cancelled` en cualquier punto). Actualizados manualmente por Ale vía `PATCH /api/admin/orders/:id` (`AdminShip.jsx`), no automáticamente.
- Todas las tablas de catálogo (`places`, `sizes`, `frames`, `colors`, `addons`) están sembradas con datos reales — ya no hay concepto de "seed JSON temporal" pendiente de migrar, eso era la v0.1 de este doc describiendo el estado pre-lanzamiento.
