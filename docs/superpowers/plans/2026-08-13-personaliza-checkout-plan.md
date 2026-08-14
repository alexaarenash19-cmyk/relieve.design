# /personaliza — checkout automático Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/personaliza`'s lead-capture form (PR #208) with a self-serve flow — elegir tamaño → ubicar en Google Maps → elegir color → ver un preview 3D real del terreno → comprar directo, usando el checkout de Stripe que el sitio ya tiene.

**Architecture:** Un wizard de pasos nuevo (`Personalize.jsx`, reutilizando `StepProgress.jsx`) alimenta dos componentes nuevos — `LocationPicker.jsx` (Google Maps + Places, marco de encuadre) y `TerrainPreview.jsx` (Three.js + Google Elevation API) — y termina llamando `addItem()` del `CartContext` ya existente con un item que lleva un campo `custom_location`. Ese campo es el único cambio real al backend: se agrega una columna `order_items.custom_location jsonb`, y tanto `api/checkout.js` como `api/webhooks/stripe.js` (que ya recalculan precio server-side de forma independiente, por diseño) ganan una rama que usa `getPersonalizedPrice()` en vez de `calcUnitPriceCents()` cuando ese campo está presente. Todo lo demás — Stripe Checkout Session, `CartContext`, `CartDrawer`, el correo de confirmación al cliente, `/pedido/:token` — se reutiliza sin cambios estructurales.

**Tech Stack:** Vite + React 19 + React Router 7 + Tailwind v4 (CSS-first, sin `tailwind.config.js`) + GSAP + Three.js/`@react-three/fiber`/`drei` (ya instalados) + Stripe Checkout + Supabase + Google Maps JavaScript API (nuevo). JSX puro, sin TypeScript. Tests: `node:assert` puro, colocados o en `tests/`, encadenados en `package.json`'s `scripts.test` — sin Jest/Vitest.

## Global Constraints

- **No clon local del repo.** Todo cambio se hace vía `gh api` (contents API / git data API) contra `alexaarenash19-cmyk/relieve-web`. Cada blob pusheado se verifica byte-a-byte re-descargándolo y comparando contra el archivo local antes de dar el paso por terminado.
- **Spec de referencia:** `docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md` (aprobado). Cualquier ambigüedad se resuelve releyendo ese documento antes de improvisar.
- **El 15% se calcula solo sobre el precio base del tamaño** — nunca sobre marco (siempre `'parota'`, sin costo extra) ni sobre color (sin costo extra). `frame_code` para piezas personalizadas es siempre el string `'parota'`, nunca un valor elegible.
- **No hay generación automática de modelo 3D/STL.** Ale sigue produciendo cada pieza a mano — el backend solo necesita capturar y mostrarle los datos geográficos, nunca generar un archivo de producción.
- **Nunca confiar en un precio que mande el cliente.** Tanto `api/checkout.js` como `api/webhooks/stripe.js` recalculan el precio de forma independiente — este patrón ya existe para piezas de catálogo y se extiende igual para piezas personalizadas, sin excepciones.
- **Textos exactos, no parafrasear:** botón `"Comprar mi Relieve"` (nunca "Solicitar"/"Enviar solicitud"/"Contactarme"), leyenda del preview `"Vista previa generada de tu terreno."` (sin mención de Ale, sin nada más), mensaje de validación incompleta `"Completa tu Relieve para continuar."`, encabezado post-compra `"Tu Relieve está en marcha."`, precio mostrado como `"Relieve personalizado"` / `"$Z MXN"` (nunca desglosado como "+15%" en el resumen).
- **El catálogo curado (`Product.jsx`) no se toca.** Esta spec es exclusivamente `/personaliza`.
- **`GOOGLE_MAPS_API_KEY` client-side va prefijada `VITE_` en Vite** (`import.meta.env.VITE_GOOGLE_MAPS_API_KEY`) — sin ese prefijo, Vite no la expone al bundle del navegador.
- **CSP se toca en `Content-Security-Policy-Report-Only`** (auditoría de seguridad 13 ago 2026, hallazgo 🟠 #1 — sigue sin pasar a enforcement, fuera de alcance de este plan).

---

### Task 1: Migración — `order_items.custom_location`

**Files:**
- Create: `supabase/migrations/20260813020001_order_items_custom_location.sql`
- Modify: `docs/database.md` (sección `order_items`)

**Interfaces:**
- Produces: columna `order_items.custom_location jsonb` (nullable). Shape esperado (no forzado por el schema, validado en `api/checkout.js` — Task 4): `{ place_id: string, formatted_address: string, latitude: number, longitude: number, map_bounds: { north: number, south: number, east: number, west: number }, zoom: number }`.

- [ ] **Step 1: Escribir la migración**

```sql
-- /personaliza checkout automático (docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md)
-- sección 4 — una sola columna jsonb, no seis columnas sueltas: la mayoría
-- de los order_items (catálogo) nunca la usan. custom_place (ya existe)
-- sigue guardando el nombre legible del lugar; esta columna guarda los
-- datos geográficos que Ale necesita para tallar la pieza a mano (no hay
-- generación automática de modelo en este proyecto).
alter table order_items add column custom_location jsonb;
```

- [ ] **Step 2: Push vía contents API y verificar byte a byte**

```bash
node make_payload.js migration.sql payload.json "feat: order_items.custom_location for /personaliza checkout" <branch>
gh api --method PUT repos/alexaarenash19-cmyk/relieve-web/contents/supabase/migrations/20260813020001_order_items_custom_location.sql --input payload.json
# luego: descargar de vuelta, diff contra el archivo local, confirmar 0 diferencias
```

Expected: la respuesta trae un `sha` nuevo; el diff posterior no muestra líneas.

- [ ] **Step 3: Actualizar `docs/database.md`**

Justo debajo del bloque `CREATE TABLE order_items (...)` existente (busca `custom_place  TEXT,                 -- ubicación personalizada (si no está en catálogo)`), agregar una línea a la nota de esa tabla:

```
- `custom_location` (jsonb, nullable): datos geográficos de una pieza personalizada vía /personaliza — place_id/formatted_address/latitude/longitude/map_bounds/zoom de Google Maps. NULL para piezas de catálogo. No hay generación automática de modelo desde estos datos — Ale los usa a mano, igual que produce todo el catálogo hoy (docs/decisions.md).
```

- [ ] **Step 4: Commit del doc**

```bash
node make_payload.js database.md payload2.json "docs: document order_items.custom_location" <branch> <sha-actual-de-database.md>
gh api --method PUT repos/alexaarenash19-cmyk/relieve-web/contents/docs/database.md --input payload2.json
```

---

### Task 2: `getPersonalizedPrice()` en `lib/pricing.js`

**Files:**
- Modify: `lib/pricing.js`

**Interfaces:**
- Consumes: `supabase` (`./supabase.js`), `DUMMY_SIZES` (`./dummyCatalog.js`), `PricingError` (definida en el mismo archivo).
- Produces: `export async function getPersonalizedPrice(size_code: string): Promise<number>` — centavos MXN, redondeado, o lanza `PricingError('invalid_size', ...)`.

- [ ] **Step 1: Agregar la función**

Al final de `lib/pricing.js` (después de `calcUnitPriceCents`):

```js
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4.
// El 15% se calcula SOLO sobre sizes.price_cents — nunca sobre frame (siempre
// 'parota', sin delta) ni color (sin delta) para piezas personalizadas. Mismo
// patrón Supabase-primero/DUMMY_SIZES-fallback que calcUnitPriceCents arriba,
// reducido a un solo lookup porque la fórmula no necesita frame/addons.
export async function getPersonalizedPrice(size_code) {
  const { data: size, error } = await supabase
    .from('sizes')
    .select('price_cents')
    .eq('code', size_code)
    .maybeSingle();

  if (error) {
    if (!(size_code in DUMMY_SIZES)) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
    return Math.round(DUMMY_SIZES[size_code] * 1.15);
  }

  if (!size) throw new PricingError('invalid_size', `Unknown size_code: ${size_code}`);
  return Math.round(size.price_cents * 1.15);
}
```

- [ ] **Step 2: Push y verificar**

```bash
node make_payload.js pricing.js payload.json "feat: getPersonalizedPrice for /personaliza checkout" <branch> <sha>
gh api --method PUT repos/alexaarenash19-cmyk/relieve-web/contents/lib/pricing.js --input payload.json
```

(La cobertura de test para esta función vive en Task 3 — vía el endpoint `personalized_pricing` que la llama — y en Task 4/5 vía checkout/webhook. No se crea un archivo de test dedicado para `pricing.js`: ni `calcUnitPriceCents` lo tiene hoy, se cubre indirectamente por los handlers que lo usan.)

---

### Task 3: `POST /api/personalized-pricing` (precio en vivo del wizard)

**Files:**
- Modify: `api/catalog.js`
- Modify: `vercel.json`
- Modify: `docs/api.md`
- Modify: `tests/catalog.test.mjs`

**Interfaces:**
- Consumes: `getPersonalizedPrice` (Task 2), `checkRateLimit` (`../lib/rateLimit.js`, ya importado en este archivo), `PricingError` (`../lib/pricing.js`, ya importado).
- Produces: `POST /api/personalized-pricing { size_code } -> 200 { unit_price }` — mismo shape de respuesta que `/api/pricing` (`{ unit_price }`, no `unit_price_cents`, por consistencia con ese endpoint ya documentado).

- [ ] **Step 1: Agregar el handler en `api/catalog.js`**

Junto a `postPricing` (después de su cierre `}`), importar `getPersonalizedPrice`:

```js
// en el import existente de lib/pricing.js, agregar getPersonalizedPrice:
import { calcUnitPriceCents, getPersonalizedPrice, PricingError } from '../lib/pricing.js';
```

Y agregar el handler nuevo:

```js
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4 —
// precio en vivo del wizard de /personaliza. Mismo criterio de rate limit
// que postPricing (el wizard recalcula cada vez que cambia el tamaño).
async function postPersonalizedPricing(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'method_not_allowed', 'Use POST');
  }

  if (!(await checkRateLimit(req, res, { key: 'personalized-pricing', limit: 40, windowMs: 60_000 }))) return;

  const { size_code } = req.body ?? {};
  if (!size_code) {
    return sendError(res, 400, 'invalid_request', 'size_code is required');
  }

  try {
    const unit_price = await getPersonalizedPrice(size_code);
    return res.status(200).json({ unit_price });
  } catch (err) {
    if (err instanceof PricingError) return sendError(res, 400, err.code, err.message);
    return sendError(res, 500, 'db_error', err.message);
  }
}
```

Y registrarlo en `RESOURCES`:

```js
const RESOURCES = {
  places: getPlaces,
  pricing: postPricing,
  personalized_pricing: postPersonalizedPricing,
  waitlist: postWaitlist,
  curva_de_nivel: postCurvaDeNivel,
  personalize_requests: postPersonalizeRequest,
  orders: getOrder,
  orders_by_session: getOrderBySession,
};
```

- [ ] **Step 2: Rewrite en `vercel.json`**

Junto al rewrite existente de `/api/pricing`:

```json
{ "source": "/api/personalized-pricing", "destination": "/api/catalog?resource=personalized_pricing" },
```

- [ ] **Step 3: Documentar en `docs/api.md`**

Justo debajo de la sección `### POST /api/pricing` existente:

```markdown
### POST /api/personalized-pricing
Body: `{ size_code }` → `{ unit_price }` (centavos MXN). `= Math.round(sizes.price_cents * 1.15)`, calculado en `lib/pricing.js`'s `getPersonalizedPrice`. Usado por el wizard de `/personaliza` (docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md) — el 15% aplica solo aquí, nunca a piezas de catálogo.
```

- [ ] **Step 4: Escribir el test (falla primero)**

En `tests/catalog.test.mjs`, después del bloque `// Pricing falls back to the hardcoded catalog mirror too.` (el último bloque del archivo antes de `console.log`):

```js
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4
// — getPersonalizedPrice: mediano (129900) * 1.15 = 149385.
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'personalized_pricing' }, { size_code: 'mediano' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.unit_price, 149385);
}
{
  const res = mockRes();
  await handler(mockReq('POST', { resource: 'personalized_pricing' }, { size_code: 'no-existe' }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_size');
}
```

- [ ] **Step 5: Correr el test localmente contra un árbol temporal**

Igual que la verificación ya hecha para PR #209 — copiar `api/catalog.js` + sus dependencias (`lib/supabase.js`, `lib/errors.js`, `lib/pricing.js`, `lib/rateLimit.js`, `lib/dummyCatalog.js`, `lib/alerts.js`, `lib/validate.js`) + `tests/catalog.test.mjs` a un directorio temporal en el scratchpad, `npm install @supabase/supabase-js --no-save`, `node tests/catalog.test.mjs`.

Run: `node tests/catalog.test.mjs`
Expected: `catalog dispatch checks: OK` (sin excepción sin capturar).

- [ ] **Step 6: Push de los 3 archivos y verificación byte a byte, luego borrar el árbol temporal**

---

### Task 4: `api/checkout.js` — rama de pricing personalizado

**Files:**
- Modify: `api/checkout.js`
- Modify: `tests/checkout.test.mjs`

**Interfaces:**
- Consumes: `getPersonalizedPrice` (Task 2).
- Produces: `priceItem(item)` acepta ahora un `item.custom_location` opcional; cuando está presente, usa `getPersonalizedPrice` en vez de `calcUnitPriceCents`, valida el shape de `custom_location`, y el `custom_place` devuelto se guarda igual que antes en el objeto pricing resultante (ya soportado — ver Step 3).

- [ ] **Step 1: Import**

```js
import { calcUnitPriceCents, getPersonalizedPrice, PricingError } from '../lib/pricing.js';
```

- [ ] **Step 2: Subir el límite de `custom_place` y agregar el validador de `custom_location`**

`FREE_TEXT_LIMITS.custom_place` sube de 80 a 120 — un `formatted_address` real de Google Places para una ciudad/POI ("Ciudad de México, CDMX, México") cabe cómodo en 80, pero algunos lugares más largos no; 120 da margen sin abrir la puerta a texto arbitrariamente largo:

```js
const FREE_TEXT_LIMITS = {
  memory_note: 140,
  custom_place: 120,
  plate_text: 60,
  gift_message: 300,
};
```

Debajo de `assertFreeTextLength`, agregar el validador nuevo:

```js
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 5
// — "antes de pagar" también aplica server-side, no solo como gate del
// botón en el cliente (mismo principio que el resto de este archivo:
// nunca confiar en que el cliente ya validó). map_bounds usa el shape
// que google.maps.LatLngBounds.toJSON() produce.
function assertValidCustomLocation(loc) {
  if (!loc || typeof loc !== 'object') {
    throw new PricingError('invalid_custom_location', 'custom_location is required for personalized items');
  }
  const { place_id, formatted_address, latitude, longitude, map_bounds, zoom } = loc;
  if (!place_id || typeof place_id !== 'string' || place_id.length > 200) {
    throw new PricingError('invalid_custom_location', 'custom_location.place_id is invalid');
  }
  if (!formatted_address || typeof formatted_address !== 'string' || formatted_address.length > 200) {
    throw new PricingError('invalid_custom_location', 'custom_location.formatted_address is invalid');
  }
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
    throw new PricingError('invalid_custom_location', 'custom_location.latitude is invalid');
  }
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
    throw new PricingError('invalid_custom_location', 'custom_location.longitude is invalid');
  }
  if (typeof zoom !== 'number' || zoom < 0 || zoom > 22) {
    throw new PricingError('invalid_custom_location', 'custom_location.zoom is invalid');
  }
  if (
    !map_bounds ||
    typeof map_bounds.north !== 'number' ||
    typeof map_bounds.south !== 'number' ||
    typeof map_bounds.east !== 'number' ||
    typeof map_bounds.west !== 'number'
  ) {
    throw new PricingError('invalid_custom_location', 'custom_location.map_bounds is invalid');
  }
}
```

- [ ] **Step 3: Ramificar `priceItem()`**

Reemplazar el bloque `Promise.all` + su resultado (desde `const [placeResult, colorResult, unit_price_cents] = await Promise.all([` hasta el `return { ... }` final de la función) por:

```js
  if (item.custom_location) assertValidCustomLocation(item.custom_location);

  // These three lookups are independent of each other — running them
  // sequentially (as this used to) adds two extra network round-trips to
  // Supabase per item for no reason; every millisecond here is on the
  // critical path between the customer clicking "pagar" and reaching Stripe.
  const [placeResult, colorResult, unit_price_cents] = await Promise.all([
    place_slug
      ? supabase.from('places').select('id, name, status').eq('slug', place_slug).maybeSingle()
      : Promise.resolve({ data: null }),
    color_code
      ? supabase.from('colors').select('code').eq('code', color_code).maybeSingle()
      : Promise.resolve({ data: null }),
    item.custom_location
      ? getPersonalizedPrice(size_code)
      : calcUnitPriceCents({ size_code, frame_code, addons }),
  ]);

  if (place_slug && !placeResult.data) {
    throw new PricingError('invalid_place', `Unknown place_slug: ${place_slug}`);
  }
  if (place_slug && !SELLABLE_STATUSES.has(placeResult.data.status)) {
    throw new PricingError('not_available', `${place_slug} is not currently sellable (status: ${placeResult.data.status})`);
  }
  if (color_code && !colorResult.data) {
    throw new PricingError('invalid_color', `Unknown color_code: ${color_code}`);
  }
  const place = placeResult.data;
  const name = `Relieve · ${place?.name ?? custom_place} · ${size_code} · ${frame_code}`;

  return {
    place_id: place?.id ?? null,
    name,
    unit_price_cents,
    qty: resolvedQty,
    custom_place: custom_place ?? null,
    custom_location: item.custom_location ?? null,
  };
}
```

Nota: `custom_place`/`custom_location` no existían antes en el objeto que `priceItem` devuelve — se agregan porque `api/webhooks/stripe.js` los necesita para el insert de `order_items` (Task 5), y hoy ese archivo los toma directo de `item` (el original sin procesar en `metadata`), no de lo que devuelve `priceItem`. Confirmar en Task 5 que `custom_location` efectivamente llega — `encodeItemsMetadata(items)` en el `handler` de abajo serializa el `items` ORIGINAL del cliente (línea `metadata: { ...encodeItemsMetadata(items), ... }`), no el resultado de `priceItem`, así que `custom_location` YA viaja a Stripe intacto sin este cambio — este `return` solo hace que el objeto sea internamente consistente/completo por si algo más adelante en este mismo archivo llega a necesitarlo (no rompe nada existente, `subtotal_cents`/`line_items` más abajo solo leen `unit_price_cents`/`qty`/`name`).

- [ ] **Step 4: Escribir los tests (fallan primero)**

En `tests/checkout.test.mjs`, después del test 6 (qty cap) existente, antes de `console.log('checkout request-validation checks: OK');`:

```js
// 7. docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md — un
// item personalizado sin custom_location válido se rechaza antes de
// cualquier lookup a Supabase.
{
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{ custom_place: 'Un lugar', size_code: 'chico', frame_code: 'parota', qty: 1, custom_location: { place_id: 'x' } }],
      email: 'a@b.com',
    }),
    res
  );
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error.code, 'invalid_custom_location');
}

// 8. Un item personalizado completo y válido usa getPersonalizedPrice
// (+15%), no calcUnitPriceCents — verificado contra el fallback dummy
// (mediano: 129900 * 1.15 = 149385) ya que Supabase real no está montado
// en este test.
{
  const res = mockRes();
  await handler(
    mockReq('POST', {
      items: [{
        custom_place: 'Ciudad de México, CDMX, México',
        size_code: 'mediano',
        frame_code: 'parota',
        color_code: 'blanco',
        qty: 1,
        custom_location: {
          place_id: 'ChIJB3UJ2yYAzoURgKDXCKP5-oI',
          formatted_address: 'Ciudad de México, CDMX, México',
          latitude: 19.4326,
          longitude: -99.1332,
          zoom: 12,
          map_bounds: { north: 19.5, south: 19.3, east: -99.0, west: -99.3 },
        },
      }],
      email: 'a@b.com',
    }),
    res
  );
  // color_code lookup hits the same unreachable example.supabase.co
  // Supabase host as everything else in this test file (unmocked) — se
  // resuelve como invalid_color en vez de 200, lo cual de todos modos
  // confirma que llegó más allá de la validación de custom_location y de
  // getPersonalizedPrice sin lanzar. Si eso cambia (Supabase real
  // montado), este test necesita mockFetch como el test 5 de este mismo
  // archivo.
  assert.notStrictEqual(res.body?.error?.code, 'invalid_custom_location');
  assert.notStrictEqual(res.body?.error?.code, 'invalid_size');
}
```

- [ ] **Step 5: Correr localmente y confirmar**

Reusar el árbol temporal ya usado para verificar PR #209 (`api/checkout.js` + `lib/{supabase,errors,pricing,rateLimit,dummyCatalog}.js`, `stripe`/`@supabase/supabase-js` instalados aparte).

Run: `node tests/checkout.test.mjs`
Expected: `checkout request-validation checks: OK`

- [ ] **Step 6: Push y verificación byte a byte**

---

### Task 5: `api/webhooks/stripe.js` — persistir `custom_location` y usar `getPersonalizedPrice`

**Files:**
- Modify: `api/webhooks/stripe.js`
- Modify: `tests/stripe-webhook.test.mjs`

**Interfaces:**
- Consumes: `getPersonalizedPrice` (Task 2).
- Produces: `order_items` insert incluye `custom_location` cuando el item lo trae; el precio se recalcula con `getPersonalizedPrice` en vez de `calcUnitPriceCents` para esos items — mismo principio de "nunca confiar en el precio del checkout anterior" que ya aplica a todo lo demás en este archivo.

- [ ] **Step 1: Import**

```js
import { calcUnitPriceCents, getPersonalizedPrice } from '../../lib/pricing.js';
```

- [ ] **Step 2: Ramificar el cálculo de precio en `createOrderFromSession`**

Reemplazar:

```js
      const unit_price_cents = await calcUnitPriceCents({
        size_code: item.size_code,
        frame_code: item.frame_code,
        addons,
      });
```

por:

```js
      const unit_price_cents = item.custom_location
        ? await getPersonalizedPrice(item.size_code)
        : await calcUnitPriceCents({
            size_code: item.size_code,
            frame_code: item.frame_code,
            addons,
          });
```

- [ ] **Step 3: Persistir `custom_location` en el insert de `order_items`**

En el `.insert(pricedItems.map((item) => ({ ... })))`, agregar un campo:

```js
  const { error: itemsError } = await supabase.from('order_items').insert(
    pricedItems.map((item) => ({
      order_id: order.id,
      place_id: item.place_id,
      custom_place: item.custom_place ?? null,
      custom_location: item.custom_location ?? null,
      size_code: item.size_code,
      frame_code: item.frame_code,
      color_code: item.color_code ?? null,
      orientation: item.orientation ?? 'horizontal',
      plate_text: item.plate_text ?? null,
      memory_note: item.memory_note ?? null,
      capelo: !!item.capelo,
      unit_price_cents: item.unit_price_cents,
      qty: item.qty || 1,
    }))
  );
```

- [ ] **Step 4: Escribir el test (falla primero)**

En `tests/stripe-webhook.test.mjs`, después del test 7 existente, antes de `console.log(...)`:

```js
// 8. docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md —
// checkout.session.completed con un item personalizado: el precio se
// recalcula con getPersonalizedPrice (mediano * 1.15 = 149385, no el
// precio "confirmado" en metadata), y custom_location llega hasta el
// insert de order_items.
{
  const resendCalls = [];
  let insertedOrderItems = null;

  mockFetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();

    if (url.startsWith('https://api.resend.com/')) {
      resendCalls.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: 'email_test' }), { status: 200 });
    }
    if (url.includes('/rest/v1/orders')) {
      if (method === 'GET') {
        return new Response(JSON.stringify({ code: 'PGRST116', message: 'no rows' }), { status: 406 });
      }
      return new Response(
        JSON.stringify({ id: 'order-uuid-personalize', number: 'RLV-2026-000002', status_token: 'tok456' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.includes('/rest/v1/order_items')) {
      insertedOrderItems = JSON.parse(init.body);
      return new Response(JSON.stringify(insertedOrderItems), { status: 201 });
    }
    if (url.includes('/rest/v1/carts')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes('/rest/v1/sizes') || url.includes('/rest/v1/frames') || url.includes('/rest/v1/addons')) {
      // catalog tables unreachable -> getPersonalizedPrice/calcUnitPriceCents fall back to dummyCatalog
      return new Response('Internal Server Error', { status: 500 });
    }
    throw new Error(`Unexpected fetch to ${url} in test 8`);
  };

  const customLocation = {
    place_id: 'ChIJB3UJ2yYAzoURgKDXCKP5-oI',
    formatted_address: 'Ciudad de México, CDMX, México',
    latitude: 19.4326,
    longitude: -99.1332,
    zoom: 12,
    map_bounds: { north: 19.5, south: 19.3, east: -99.0, west: -99.3 },
  };
  const items = [{
    custom_place: 'Ciudad de México, CDMX, México',
    custom_location: customLocation,
    size_code: 'mediano',
    frame_code: 'parota',
    color_code: 'blanco',
    qty: 1,
  }];
  const { payload, header } = signedPayload('checkout.session.completed', {
    id: 'cs_test_personalize',
    customer_email: 'cliente3@example.com',
    metadata: { items: JSON.stringify(items), is_gift: 'false', gift_message: '' },
  });
  const res = mockRes();
  await handler(mockReq('POST', payload, { 'stripe-signature': header }), res);
  mockFetch = null;

  assert.strictEqual(res.statusCode, 200, `expected 200, got ${res.statusCode} body=${JSON.stringify(res.body)}`);
  assert.ok(insertedOrderItems, 'expected an order_items insert to happen');
  assert.strictEqual(insertedOrderItems[0].unit_price_cents, 149385, 'expected mediano (129900) * 1.15 rounded');
  assert.deepStrictEqual(insertedOrderItems[0].custom_location, customLocation);
}
```

- [ ] **Step 5: Correr localmente**

Reusar/extender el árbol temporal ya armado para `tests/checkout.test.mjs` (agregar `api/webhooks/stripe.js` y `lib/alerts.js` al árbol, `stripe`/`@supabase/supabase-js` ya instalados).

Run: `node tests/stripe-webhook.test.mjs`
Expected: `stripe webhook signature + event handling checks: OK`

- [ ] **Step 6: Push y verificación byte a byte**

---

### Task 6: `lib/alerts.js` — mostrar ubicación en el correo de Ale

**Files:**
- Modify: `lib/alerts.js`
- Modify: `tests/alerts.test.mjs`

**Interfaces:**
- Produces: `sendOrderPaidNotification(order, items, opts)` — sin cambios de firma, pero su HTML incluye ahora un enlace a Google Maps + coordenadas cuando `items[i].custom_location` está presente.

- [ ] **Step 1: Extender el template de `rows` en `sendOrderPaidNotification`**

Reemplazar:

```js
  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;">${escapeHtml(i.place_name ?? i.custom_place)} · ${escapeHtml(i.size_code)} · ${escapeHtml(i.frame_code)}${i.color_code ? ' · ' + escapeHtml(i.color_code) : ''}${i.qty > 1 ? ' ×' + i.qty : ''}${i.memory_note ? `<br><span style="font-style:italic;">"${escapeHtml(i.memory_note)}"</span>` : ''}</td>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;text-align:right;">${money(i.unit_price_cents * i.qty)}</td>
    </tr>`,
    )
    .join('');
```

por:

```js
  // docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 4
  // — "lo mínimo que Ale necesita ver para saber qué terreno tallar". lat/lng
  // son números que ya generamos nosotros (Google Elevation/Maps API), no
  // texto libre del cliente — no necesitan escapeHtml, a diferencia de
  // formatted_address (ese sí viene de la respuesta de Google Places, pero
  // se trata igual de conservador que cualquier otro campo de esta lista).
  const locationLine = (i) =>
    i.custom_location
      ? `<br><a href="https://www.google.com/maps?q=${i.custom_location.latitude},${i.custom_location.longitude}">${escapeHtml(i.custom_location.formatted_address)} (${i.custom_location.latitude}, ${i.custom_location.longitude})</a>`
      : '';

  const rows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;">${escapeHtml(i.place_name ?? i.custom_place)} · ${escapeHtml(i.size_code)} · ${escapeHtml(i.frame_code)}${i.color_code ? ' · ' + escapeHtml(i.color_code) : ''}${i.qty > 1 ? ' ×' + i.qty : ''}${locationLine(i)}${i.memory_note ? `<br><span style="font-style:italic;">"${escapeHtml(i.memory_note)}"</span>` : ''}</td>
      <td style="padding:6px 0;border-bottom:1px dashed #C8C3BC;text-align:right;">${money(i.unit_price_cents * i.qty)}</td>
    </tr>`,
    )
    .join('');
```

- [ ] **Step 2: Escribir el test (falla primero)**

En `tests/alerts.test.mjs`, agregar un tercer bloque después del test 2 existente, antes de `globalThis.fetch = realFetch;`:

```js
// 3. docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md —
// un item personalizado incluye un link a Maps + coordenadas en el correo
// interno a Ale, con el mismo tratamiento de escapeHtml que cualquier otro
// campo de texto libre del cliente.
{
  sentEmails.length = 0;
  const personalizedItems = [
    {
      custom_place: XSS,
      custom_location: {
        formatted_address: XSS,
        latitude: 19.4326,
        longitude: -99.1332,
      },
      size_code: 'mediano',
      frame_code: 'parota',
      qty: 1,
      unit_price_cents: 149385,
    },
  ];
  await sendOrderPaidNotification(order, personalizedItems, {});
  const html = sentEmails[0].html;
  assert.ok(!html.includes('<script>'), `raw <script> leaked via custom_location.formatted_address:\n${html}`);
  assert.ok(html.includes('19.4326') && html.includes('-99.1332'), 'expected coordinates in the email');
  assert.ok(html.includes('google.com/maps'), 'expected a Google Maps link');
}
```

- [ ] **Step 3: Correr localmente**

Run: `node tests/alerts.test.mjs` (no necesita árbol temporal — este archivo no importa nada de `api/`, solo `lib/alerts.js`, que ya usa `RESEND_API_KEY` mockeado vía `globalThis.fetch`).

Expected: `alerts HTML-escaping checks: OK`

- [ ] **Step 4: Push y verificación byte a byte**

---

### Task 7: Google Maps — env var, CSP, loader compartido

**Files:**
- Modify: `.env.example`
- Modify: `vercel.json`
- Create: `src/lib/googleMapsLoader.js`

**Interfaces:**
- Produces: `export function loadGoogleMaps(): Promise<typeof google.maps>` — carga el script de Google Maps JS API una sola vez (idempotente), resuelve con `window.google.maps`. Consumida por `LocationPicker.jsx` (Task 9) y `TerrainPreview.jsx` (Task 10).

- [ ] **Step 1: `.env.example`**

Agregar, junto a la sección de Stripe (mismo criterio: servicios externos con costo real):

```
# Google Maps (personaliza — LocationPicker + TerrainPreview). Client-side,
# expuesta al bundle vía prefijo VITE_ — restringir por HTTP referrer en
# Google Cloud Console, no por secreto (una API key de Maps JS siempre es
# visible en el navegador por diseño).
VITE_GOOGLE_MAPS_API_KEY=
```

- [ ] **Step 2: `vercel.json` — CSP y rewrite**

En el header `Content-Security-Policy-Report-Only`, agregar los dominios de Google Maps a `script-src`, `connect-src` e `img-src`:

```
default-src 'self'; script-src 'self' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://maps.gstatic.com https://maps.googleapis.com; connect-src 'self' https://*.supabase.co https://maps.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

Y el rewrite de `personalized-pricing` (ya agregado en Task 3 — confirmar que quedó, no duplicarlo).

- [ ] **Step 3: `src/lib/googleMapsLoader.js`**

```js
// Google Maps JS API se carga una sola vez por sesión de navegador —
// LocationPicker.jsx (búsqueda + mapa) y TerrainPreview.jsx (Elevation vía
// google.maps.ElevationService) comparten la misma carga en vez de cada
// uno inyectar su propio <script>. libraries=places,elevation trae los dos
// paquetes que este feature necesita en una sola descarga.
let loadPromise = null;

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY no está configurada.'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,elevation&v=weekly`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('No pudimos cargar Google Maps.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
```

- [ ] **Step 4: Push de los 3 archivos y verificación byte a byte**

(Sin test automatizado — depende de `window`/`document`, mismo criterio que el resto de componentes de UI en este repo no llevan `.test.mjs`.)

---

### Task 8: `src/lib/terrainMesh.js` — helpers puros del preview 3D

**Files:**
- Create: `src/lib/terrainMesh.js`
- Create: `src/lib/terrainMesh.test.mjs`
- Modify: `package.json` (agregar a `scripts.test`)

**Interfaces:**
- Produces:
  - `buildElevationGrid(mapBounds: {north,south,east,west}, gridSize?: number): Array<{lat,lng}>` — grilla row-major, north→south, west→east.
  - `normalizeElevations(elevations: number[]): number[]` — 0..1, terreno plano → 0.5 en todos.
  - `heightmapToTextureData(normalized: number[], gridSize: number): Uint8Array` — RGBA row-major, listo para `THREE.DataTexture`.
- Consumed by: `TerrainPreview.jsx` (Task 10).

- [ ] **Step 1: Escribir el test primero**

```js
// src/lib/terrainMesh.test.mjs
// Run: node src/lib/terrainMesh.test.mjs
import assert from 'node:assert';
import { buildElevationGrid, normalizeElevations, heightmapToTextureData } from './terrainMesh.js';

// buildElevationGrid: 2x2 grid at the 4 corners of a known bounds box.
{
  const bounds = { north: 10, south: 0, east: 20, west: 0 };
  const grid = buildElevationGrid(bounds, 2);
  assert.strictEqual(grid.length, 4);
  assert.deepStrictEqual(grid[0], { lat: 10, lng: 0 });   // NW
  assert.deepStrictEqual(grid[1], { lat: 10, lng: 20 });  // NE
  assert.deepStrictEqual(grid[2], { lat: 0, lng: 0 });    // SW
  assert.deepStrictEqual(grid[3], { lat: 0, lng: 20 });   // SE
}

// normalizeElevations: min->0, max->1, linear in between.
{
  const normalized = normalizeElevations([100, 150, 200]);
  assert.strictEqual(normalized[0], 0);
  assert.strictEqual(normalized[1], 0.5);
  assert.strictEqual(normalized[2], 1);
}

// normalizeElevations: flat terrain (min === max) doesn't divide by zero.
{
  const normalized = normalizeElevations([500, 500, 500]);
  assert.deepStrictEqual(normalized, [0.5, 0.5, 0.5]);
}

// heightmapToTextureData: 2x2 grid -> 16 bytes (4 pixels * RGBA), grayscale
// (R=G=B), alpha always opaque.
{
  const data = heightmapToTextureData([0, 0.5, 1, 1], 2);
  assert.strictEqual(data.length, 16);
  assert.deepStrictEqual([...data.slice(0, 4)], [0, 0, 0, 255]);
  assert.deepStrictEqual([...data.slice(4, 8)], [128, 128, 128, 255]);
  assert.deepStrictEqual([...data.slice(8, 12)], [255, 255, 255, 255]);
}

console.log('terrainMesh.test.mjs: all assertions passed');
```

- [ ] **Step 2: Correr y confirmar que falla (el módulo no existe todavía)**

Run: `node src/lib/terrainMesh.test.mjs`
Expected: `Cannot find module './terrainMesh.js'` (o equivalente `ERR_MODULE_NOT_FOUND`).

- [ ] **Step 3: Implementar `src/lib/terrainMesh.js`**

```js
// Helpers puros para TerrainPreview.jsx — separados del componente para que
// la parte matemática (armar la grilla de consulta a Google Elevation API,
// normalizar las elevaciones crudas a un heightmap 0..1) sea testeable sin
// un contexto WebGL ni una llamada real a la API. docs/superpowers/specs/
// 2026-08-13-personaliza-checkout-design.md sección 2.

// Google Elevation API's `locations` param espera una lista plana de
// {lat, lng}. Grilla row-major, north -> south, west -> east — mismo orden
// que heightmapToTextureData espera recibir de vuelta.
export function buildElevationGrid(mapBounds, gridSize = 32) {
  const { north, south, east, west } = mapBounds;
  const points = [];
  for (let row = 0; row < gridSize; row++) {
    const lat = north - (row / (gridSize - 1)) * (north - south);
    for (let col = 0; col < gridSize; col++) {
      const lng = west + (col / (gridSize - 1)) * (east - west);
      points.push({ lat, lng });
    }
  }
  return points;
}

// Normaliza metros de elevación cruda (Google Elevation API's
// results[].elevation, en el mismo orden row-major que buildElevationGrid
// generó) a 0..1 para usarse como displacement/heightmap. Terreno
// perfectamente plano (min === max) normaliza a 0.5 parejo en vez de
// dividir entre cero.
export function normalizeElevations(elevations) {
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  if (max === min) return elevations.map(() => 0.5);
  return elevations.map((e) => (e - min) / (max - min));
}

// Empaca un heightmap normalizado 0..1 (row-major, gridSize×gridSize) en un
// Uint8Array RGBA para THREE.DataTexture — mismo valor en los 3 canales de
// color para que funcione como displacementMap sin importar qué canal
// muestree Three.js.
export function heightmapToTextureData(normalized, gridSize) {
  const data = new Uint8Array(gridSize * gridSize * 4);
  for (let i = 0; i < normalized.length; i++) {
    const v = Math.round(normalized[i] * 255);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  return data;
}
```

- [ ] **Step 4: Correr de nuevo y confirmar que pasa**

Run: `node src/lib/terrainMesh.test.mjs`
Expected: `terrainMesh.test.mjs: all assertions passed`

- [ ] **Step 5: Encadenar en `package.json`'s `scripts.test`**

Agregar `&& node src/lib/terrainMesh.test.mjs` junto a los demás `node src/lib/*.test.mjs` existentes (después de `node src/lib/theme.test.mjs`, mismo patrón).

- [ ] **Step 6: Push de los 3 archivos y verificación byte a byte**

---

### Task 9: `src/components/LocationPicker.jsx`

**Files:**
- Create: `src/components/LocationPicker.jsx`

**Interfaces:**
- Consumes: `loadGoogleMaps` (Task 7).
- Produces: `<LocationPicker aspectRatio="1/1" onConfirm={(location) => void} />` donde `aspectRatio` es `"1/1"` o `"3/2"` (viene del tamaño ya elegido, calculado en `Personalize.jsx` — Task 11) y `location` tiene exactamente el shape que `assertValidCustomLocation` (Task 4) espera: `{ place_id, formatted_address, latitude, longitude, map_bounds: {north,south,east,west}, zoom }`.

- [ ] **Step 1: Escribir el componente**

```jsx
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 1.
// Búsqueda (Places) + mapa interactivo, con un marco de encuadre FIJO
// (no se mueve/redimensiona) cuya proporción viene del tamaño ya elegido
// en el paso anterior del wizard — el usuario mueve el MAPA por debajo del
// marco, como encuadrar una foto de perfil, nunca al revés.
//
// map_bounds no se calcula desde map.getBounds() (esos son los bounds de
// TODO el div del mapa, no solo del área dentro del marco) — se calcula
// proyectando las 2 esquinas del marco (en píxeles, relativas al div del
// mapa) a lat/lng reales vía la Projection del mapa. Un OverlayView vacío
// es la única forma que expone esa Projection en la API de Google Maps.
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMapsLoader.js';

const DEFAULT_CENTER = { lat: 19.4326, lng: -99.1332 }; // Ciudad de México
const DEFAULT_ZOOM = 5;

export default function LocationPicker({ aspectRatio, onConfirm }) {
  const mapDivRef = useRef(null);
  const searchDivRef = useRef(null);
  const frameRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const selectedPlaceRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [hasFramed, setHasFramed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;

        const map = new maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        // OverlayView vacío — su único propósito es exponer getProjection()
        // una vez que el mapa termina su primer render (evento 'idle').
        class ProjectionOverlay extends maps.OverlayView {
          onAdd() {}
          draw() {}
          onRemove() {}
        }
        const overlay = new ProjectionOverlay();
        overlay.setMap(map);
        overlayRef.current = overlay;

        const autocomplete = new maps.places.PlaceAutocompleteElement();
        searchDivRef.current.appendChild(autocomplete);
        autocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['id', 'formattedAddress', 'location', 'viewport'] });
          selectedPlaceRef.current = {
            place_id: place.id,
            formatted_address: place.formattedAddress,
          };
          map.setCenter(place.location);
          if (place.viewport) map.fitBounds(place.viewport);
        });

        maps.event.addListenerOnce(map, 'idle', () => {
          if (!cancelled) {
            setReady(true);
            setHasFramed(true); // el centro/zoom inicial ya es un encuadre válido
          }
        });
      })
      .catch((err) => setLoadError(err.message));

    return () => {
      cancelled = true;
    };
  }, []);

  function frameCornersToLatLng(maps, map, overlay) {
    const mapDiv = mapDivRef.current;
    const frameEl = frameRef.current;
    const mapRect = mapDiv.getBoundingClientRect();
    const frameRect = frameEl.getBoundingClientRect();

    const projection = overlay.getProjection();
    const nwPixel = new maps.Point(frameRect.left - mapRect.left, frameRect.top - mapRect.top);
    const sePixel = new maps.Point(frameRect.right - mapRect.left, frameRect.bottom - mapRect.top);

    const nw = projection.fromContainerPixelToLatLng(nwPixel);
    const se = projection.fromContainerPixelToLatLng(sePixel);

    return {
      north: nw.lat(),
      west: nw.lng(),
      south: se.lat(),
      east: se.lng(),
    };
  }

  async function handleConfirm() {
    const maps = window.google.maps;
    const map = mapRef.current;
    const overlay = overlayRef.current;
    const center = map.getCenter();
    const bounds = frameCornersToLatLng(maps, map, overlay);

    onConfirm({
      place_id: selectedPlaceRef.current?.place_id ?? null,
      formatted_address: selectedPlaceRef.current?.formatted_address ?? null,
      latitude: center.lat(),
      longitude: center.lng(),
      zoom: map.getZoom(),
      map_bounds: bounds,
    });
  }

  if (loadError) {
    return <p className="text-sm text-graphite/70">{loadError}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={searchDivRef} className="[&_gmp-place-autocomplete]:w-full" />
      <div className="relative w-full max-w-lg mx-auto" style={{ aspectRatio: '4/3' }}>
        <div ref={mapDivRef} className="absolute inset-0 rounded-[9px] overflow-hidden" />
        {/* Marco de encuadre fijo — no se mueve, el mapa se mueve debajo. */}
        <div
          ref={frameRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-gallery-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] pointer-events-none"
          style={{ aspectRatio, width: aspectRatio === '3/2' ? '80%' : '60%' }}
        />
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!ready || !hasFramed}
        className="pill-glass-active text-gallery-white px-6 py-3 rounded-[9px] font-heading font-bold disabled:opacity-40"
      >
        Confirmar ubicación
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Push y verificación byte a byte**

(Sin test automatizado — depende de `window.google`/DOM real, no reproducible con `node:assert` sin un navegador headless que este repo no usa hoy.)

---

### Task 10: `src/components/TerrainPreview.jsx`

**Files:**
- Create: `src/components/TerrainPreview.jsx`

**Interfaces:**
- Consumes: `loadGoogleMaps` (Task 7), `buildElevationGrid`/`normalizeElevations`/`heightmapToTextureData` (Task 8).
- Produces: `<TerrainPreview mapBounds={...} aspectRatio="1/1" colorHex="#F6F3ED" />` — monta un `@react-three/fiber` `<Canvas>` con el terreno desplazado, más la leyenda fija debajo.

- [ ] **Step 1: Escribir el componente**

```jsx
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 2.
// Terreno real (no un efecto simulado): Google Elevation API sobre una
// grilla dentro de map_bounds -> heightmap -> displacementMap de Three.js
// sobre un plano. Material mate, coloreado según blanco/negro mate
// elegido — mismo lenguaje "acabado mate" del resto de la marca.
//
// Cache por mapBounds redondeados a 4 decimales (~11m de precisión, de
// sobra para esta grilla) — evita volver a llamar Elevation API si el
// cliente regresa a ajustar el encuadre sin cambiar de lugar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { loadGoogleMaps } from '../lib/googleMapsLoader.js';
import { buildElevationGrid, normalizeElevations, heightmapToTextureData } from '../lib/terrainMesh.js';

const GRID_SIZE = 32;
const elevationCache = new Map();

function cacheKey(mapBounds) {
  const r = (n) => n.toFixed(4);
  return `${r(mapBounds.north)},${r(mapBounds.south)},${r(mapBounds.east)},${r(mapBounds.west)}`;
}

async function fetchHeightmapTexture(mapBounds) {
  const key = cacheKey(mapBounds);
  if (elevationCache.has(key)) return elevationCache.get(key);

  const maps = await loadGoogleMaps();
  const elevationService = new maps.ElevationService();
  const grid = buildElevationGrid(mapBounds, GRID_SIZE);

  const response = await new Promise((resolve, reject) => {
    elevationService.getElevationForLocations({ locations: grid }, (results, status) => {
      if (status !== 'OK' || !results) {
        reject(new Error(`Elevation API failed: ${status}`));
        return;
      }
      resolve(results);
    });
  });

  const elevations = response.map((r) => r.elevation);
  const normalized = normalizeElevations(elevations);
  const textureData = heightmapToTextureData(normalized, GRID_SIZE);

  const texture = new THREE.DataTexture(textureData, GRID_SIZE, GRID_SIZE, THREE.RGBAFormat);
  texture.needsUpdate = true;

  elevationCache.set(key, texture);
  return texture;
}

function TerrainMesh({ mapBounds, aspectRatio, colorHex }) {
  const [texture, setTexture] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setTexture(null);
    fetchHeightmapTexture(mapBounds)
      .then((tex) => {
        if (!cancelledRef.current) setTexture(tex);
      })
      .catch(() => {
        // Fail quiet — TerrainPreview's parent shows the "sin preview
        // disponible" fallback below when texture stays null.
      });
    return () => {
      cancelledRef.current = true;
    };
  }, [mapBounds]);

  const [width, height] = aspectRatio === '3/2' ? [3, 2] : [1, 1];

  if (!texture) return null;

  return (
    <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
      <planeGeometry args={[width, height, GRID_SIZE - 1, GRID_SIZE - 1]} />
      <meshStandardMaterial
        color={colorHex}
        displacementMap={texture}
        displacementScale={0.3}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

export default function TerrainPreview({ mapBounds, aspectRatio, colorHex }) {
  const memoBounds = useMemo(() => mapBounds, [
    mapBounds.north,
    mapBounds.south,
    mapBounds.east,
    mapBounds.west,
  ]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-md" style={{ aspectRatio }}>
        <Canvas camera={{ position: [0, 1.4, 1.8], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <TerrainMesh mapBounds={memoBounds} aspectRatio={aspectRatio} colorHex={colorHex} />
        </Canvas>
      </div>
      <p className="font-label uppercase tracking-wide text-xs text-graphite/50">
        Vista previa generada de tu terreno.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Push y verificación byte a byte**

(Sin test automatizado — WebGL/Canvas real, mismo criterio que el resto de componentes 3D del repo, ej. el hero GLB, tampoco tienen `.test.mjs`. La parte matemática que sí es testeable ya se cubrió en Task 8.)

---

### Task 11: `src/pages/Personalize.jsx` — rewrite completo como wizard

**Files:**
- Modify: `src/pages/Personalize.jsx` (reemplazo completo del contenido)

**Interfaces:**
- Consumes: `StepProgress` (`../components/StepProgress.jsx`, ya existe), `LocationPicker` (Task 9), `TerrainPreview` (Task 10), `useCart` (`../context/CartContext.jsx`, ya existe), `SIZES`/`COLORS`/`FRAMES`/`PRODUCTION_DAYS`/`SHIPPING_DAYS`/`formatDims` (`../lib/catalog.js`, ya existen), `fetchJson` (`../lib/fetchJsonArray.js` — el archivo se llama `fetchJsonArray.js` pero exporta dos funciones, `fetchJsonArray` y `fetchJson`; esta última es la que `Product.jsx` ya usa para `/api/pricing`, mismo import aquí).
- Produces: la página en `/personaliza`, sin cambios de ruta (ya registrada en `App.jsx`).

- [ ] **Step 1: Firma confirmada de `fetchJson`**

`src/lib/fetchJsonArray.js` exporta `export async function fetchJson(url, options, timeoutMs = 10000)` — hace `fetch` con timeout de 10s vía `AbortController`, lanza (`throw`) si la respuesta no es `ok` o si expira el timeout, y si no, devuelve el JSON ya parseado. `Product.jsx` ya la usa exactamente así para `/api/pricing` (`Product.jsx:150`). Se importa igual aquí, sin verificación adicional necesaria.

- [ ] **Step 2: Reemplazar el contenido completo del archivo**

```jsx
// docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md — rewrite
// completo. Reemplaza el lead-capture form de PR #208 (formulario ->
// correo a Ale -> cotización manual) por checkout automático: el cliente
// diseña su pieza y compra en la misma visita, reutilizando el
// CartContext/Stripe Checkout que el catálogo ya usa. La infraestructura
// de lead-capture (POST /api/personaliza, tabla personalize_requests)
// queda en el backend sin uso — no se borra (bajo riesgo, cero costo de
// mantenerla), simplemente esta página ya no la llama.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepProgress from '../components/StepProgress.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import TerrainPreview from '../components/TerrainPreview.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useDocumentHead } from '../lib/useDocumentHead.js';
import { fetchJson } from '../lib/fetchJsonArray.js';
import { WALL_SIZES, COLORS, FRAMES, PRODUCTION_DAYS, SHIPPING_DAYS, formatDims } from '../lib/catalog.js';

// D8-D10 (Product.jsx, 14 ago 2026) — mismo criterio aquí: Parota Nacional
// es el único frame real, sin selector.
const FRAME = FRAMES[0];
const STORY_MAX_LENGTH = 140; // mismo límite que memory_note ya tiene server-side (api/checkout.js's FREE_TEXT_LIMITS)

const STEPS = ['escala', 'ubicacion', 'forma', 'preview', 'historia', 'resumen'];
const STEP_LABELS = ['Escala', 'Ubicación', 'Forma', 'Preview', 'Historia', 'Resumen'];

function aspectRatioForSize(sizeCode) {
  // Único tamaño rectangular (120×80) — el resto son cuadrados.
  return sizeCode === 'especial' ? '3/2' : '1/1';
}

export default function Personalize() {
  useDocumentHead({
    title: 'Diseña tu Relieve — Relieve',
    description: 'Elige un lugar, dale forma y compra tu Relieve personalizado — sin intermediarios, con precio claro desde el primer paso.',
    canonicalPath: '/personaliza',
  });

  const navigate = useNavigate();
  const { addItem } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [sizeCode, setSizeCode] = useState(WALL_SIZES[1].code);
  const [location, setLocation] = useState(null); // shape de LocationPicker's onConfirm
  const [colorCode, setColorCode] = useState(COLORS[0].code);
  const [story, setStory] = useState('');
  const [unitPriceCents, setUnitPriceCents] = useState(null);
  const [priceError, setPriceError] = useState(false);

  // docs/superpowers/specs sección 3 — "el precio debe actualizarse
  // inmediatamente cuando el usuario cambie el tamaño". Mismo patrón que
  // Product.jsx ya usa para /api/pricing.
  useEffect(() => {
    let cancelled = false;
    setPriceError(false);
    fetchJson('/api/personalized-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size_code: sizeCode }),
    })
      .then((data) => {
        if (!cancelled && data.unit_price != null) setUnitPriceCents(data.unit_price);
      })
      .catch(() => {
        if (!cancelled) setPriceError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sizeCode]);

  const selectedSize = WALL_SIZES.find((s) => s.code === sizeCode);
  const selectedColor = COLORS.find((c) => c.code === colorCode);
  const aspectRatio = aspectRatioForSize(sizeCode);

  // docs/superpowers/specs sección 5 — validación antes de pagar,
  // duplicada del lado del cliente (gate del botón) — el servidor la
  // repite de forma independiente en api/checkout.js, nunca confía en
  // esta.
  const isComplete = Boolean(
    location?.place_id &&
    location?.map_bounds &&
    sizeCode &&
    colorCode &&
    unitPriceCents != null,
  );

  function goNext() {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  }
  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function handleBuy() {
    if (!isComplete) return;
    addItem({
      custom_place: location.formatted_address,
      custom_location: {
        place_id: location.place_id,
        formatted_address: location.formatted_address,
        latitude: location.latitude,
        longitude: location.longitude,
        map_bounds: location.map_bounds,
        zoom: location.zoom,
      },
      name: `Relieve · ${location.formatted_address} · ${sizeCode}`,
      unit_price_cents: unitPriceCents,
      qty: 1,
      size_code: sizeCode,
      frame_code: FRAME.code,
      color_code: colorCode,
      orientation: 'horizontal',
      memory_note: story || null,
    });
    navigate('/'); // el carrito abre solo (CartContext.addItem ya hace openCart)
  }

  const activeStep = STEPS[currentStep - 1];
  const isLastStep = currentStep === STEPS.length;

  return (
    // Hallazgo #8 (auditoría 10 ago 2026): pt-32 (no p-8) — mismo fix que Collections.jsx/Product.jsx.
    <main className="max-w-lg mx-auto pt-32 px-8 pb-16">
      <h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">Diseña tu Relieve</h1>
      <p className="text-graphite/70 mb-8">
        Un lugar que es solo tuyo. Elige un lugar, nosotros lo convertimos en relieve.
      </p>

      {activeStep === 'escala' && (
        <fieldset className="mb-6">
          <legend className="font-label uppercase tracking-wide text-xs mb-2">Elige tu escala</legend>
          <div className="flex flex-col gap-2">
            {WALL_SIZES.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setSizeCode(s.code)}
                className={`text-left px-4 py-3 rounded-[9px] font-heading font-bold ${
                  sizeCode === s.code ? 'pill-glass-active text-gallery-white' : 'pill-glass text-graphite'
                }`}
              >
                {s.label} — {formatDims(s.dims)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {activeStep === 'ubicacion' && (
        <div className="mb-6">
          <p className="font-label uppercase tracking-wide text-xs mb-2">Elige tu lugar</p>
          <LocationPicker aspectRatio={aspectRatio} onConfirm={(loc) => { setLocation(loc); goNext(); }} />
        </div>
      )}

      {activeStep === 'forma' && (
        <fieldset className="mb-6">
          <legend className="font-label uppercase tracking-wide text-xs mb-2">Dale forma</legend>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setColorCode(c.code)}
                aria-label={c.label}
                title={c.label}
                className={`w-10 h-10 rounded-full border-2 ${colorCode === c.code ? 'border-brand-dark' : 'border-line'}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-graphite/70">{selectedColor?.label}</p>
        </fieldset>
      )}

      {activeStep === 'preview' && location?.map_bounds && (
        <div className="mb-6">
          <TerrainPreview mapBounds={location.map_bounds} aspectRatio={aspectRatio} colorHex={selectedColor?.hex} />
        </div>
      )}

      {activeStep === 'historia' && (
        <label className="flex flex-col gap-1 mb-6">
          <span className="font-label uppercase tracking-wide text-xs">¿Por qué este lugar? (opcional)</span>
          <textarea
            value={story}
            maxLength={STORY_MAX_LENGTH}
            onChange={(e) => setStory(e.target.value)}
            className="border border-line rounded px-3 py-2"
          />
        </label>
      )}

      {activeStep === 'resumen' && (
        <div className="mb-6 bg-gallery-white rounded-[9px] p-6">
          <h2 className="font-heading font-bold text-brand-dark text-xl mb-4">Tu Relieve</h2>
          <dl className="space-y-2 text-sm mb-6">
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Ubicación</dt>
              <dd>{location?.formatted_address}</dd>
            </div>
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Tamaño</dt>
              <dd>{selectedSize?.label} — {formatDims(selectedSize?.dims)}</dd>
            </div>
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Color</dt>
              <dd>{selectedColor?.label}</dd>
            </div>
            <div>
              <dt className="font-label uppercase tracking-wide text-xs text-graphite/60">Marco</dt>
              <dd>{FRAME.label}</dd>
            </div>
          </dl>
          <p className="font-label uppercase tracking-wide text-xs text-graphite/60 mb-1">Relieve personalizado</p>
          <p className="font-heading font-bold text-brand-dark text-2xl mb-4">
            {unitPriceCents != null ? `$${(unitPriceCents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '—'}
          </p>
          <p className="text-sm text-graphite/70">Producción: {PRODUCTION_DAYS} días</p>
          <p className="text-sm text-graphite/70">Envío: Gratis</p>
          <p className="text-sm text-graphite/70 mb-4">Entrega: {SHIPPING_DAYS} días después del envío</p>
          {!isComplete && (
            <p className="text-sm text-brand-dark font-bold">Completa tu Relieve para continuar.</p>
          )}
          {priceError && (
            <p className="text-sm text-graphite/60">No pudimos calcular el precio, intenta de nuevo.</p>
          )}
        </div>
      )}

      <StepProgress
        total={STEPS.length}
        current={currentStep}
        labels={STEP_LABELS}
        onBack={goBack}
        onContinue={goNext}
        isLast={isLastStep}
        finalAction={
          <button
            type="button"
            onClick={handleBuy}
            disabled={!isComplete}
            className="pill-glass-active text-gallery-white px-6 py-3 rounded-[9px] font-heading font-bold w-full disabled:opacity-40"
          >
            Comprar mi Relieve
          </button>
        }
      />
    </main>
  );
}
```

Nota sobre el paso `ubicacion`: `LocationPicker`'s `onConfirm` ya avanza el wizard (`goNext()`) al confirmar — no lleva su propio botón "Continuar" de `StepProgress` en ese paso porque `StepProgress` ya se renderiza abajo de forma incondicional con `onContinue={goNext}` disponible como respaldo (si el usuario ya confirmó ubicación y solo quiere revisar el mapa de nuevo antes de seguir).

- [ ] **Step 3: Push y verificación byte a byte**

(Sin test automatizado — página de UI completa con dependencias de `window.google`/Canvas, mismo criterio que `Product.jsx`, que tampoco tiene `.test.mjs` pese a ser el archivo de configurador más grande del repo.)

---

### Task 12: `src/pages/OrderStatus.jsx` — confirmación "Tu Relieve está en marcha"

**Files:**
- Modify: `api/catalog.js` (`getOrder`'s `.select(...)` de `order_items`)
- Modify: `src/pages/OrderStatus.jsx`

**Interfaces:**
- Produces: cuando **todos** los items de un pedido pagado tienen `custom_location` (pedido 100% personalizado), la página muestra el encabezado/copy de la spec en vez del genérico existente. Un pedido mixto (catálogo + personalizado) conserva el copy genérico existente — caso no cubierto por la spec, no se inventa.

- [ ] **Step 1: Agregar `custom_location` al `.select()` de `getOrder`**

Confirmado al escribir este plan: `getOrder`'s `.select(...)` de `order_items` ya trae `color_code`/`frame_code`, pero NO `custom_location` — sin este cambio, `OrderStatus.jsx` nunca recibe el campo que necesita para detectar un pedido personalizado. En `api/catalog.js`, dentro de `getOrder`:

```js
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(
      'place_id, custom_place, custom_location, size_code, frame_code, color_code, qty, unit_price_cents, piece_number, places(name, series, country, type)',
    )
    .eq('order_id', order.id);
```

(único cambio: `custom_place, custom_location, size_code` en vez de `custom_place, size_code`.)

- [ ] **Step 2: Detectar pedido personalizado**

Después de la línea `const stateCopy = STATE_COPY[order.status];`, agregar:

```js
  // docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md sección 5
  // — headline propio SOLO cuando el pedido es 100% personalizado. Un
  // carrito mixto (catálogo + personalizado) no está cubierto por la spec
  // — se queda con el copy genérico existente en vez de inventar texto
  // para ese caso.
  const isFullyPersonalized = order.items?.length > 0 && order.items.every((i) => i.custom_location);
```

- [ ] **Step 3: Encabezado condicional**

Reemplazar:

```jsx
      {stateCopy && (
        <h1 className="font-heading font-bold text-brand-dark text-2xl md:text-3xl mb-4">
          {stateCopy.headline}
        </h1>
      )}
```

por:

```jsx
      {isFullyPersonalized && order.status === 'paid' ? (
        <h1 className="font-heading font-bold text-brand-dark text-2xl md:text-3xl mb-4">
          Tu Relieve está en marcha.
        </h1>
      ) : (
        stateCopy && (
          <h1 className="font-heading font-bold text-brand-dark text-2xl md:text-3xl mb-4">
            {stateCopy.headline}
          </h1>
        )
      )}
```

- [ ] **Step 4: Tarjeta de detalle para items personalizados**

La rama `else` que ya existe (item sin `item.places`, línea `<div key={i} className="py-2 flex justify-between ...">`) hoy muestra una línea genérica de una sola línea. Extenderla para mostrar el detalle completo que pide la spec cuando el item es personalizado, sin tocar el caso `item.places` (piezas de catálogo):

Reemplazar:

```jsx
          ) : (
            <div key={i} className="py-2 flex justify-between font-label uppercase tracking-wide text-xs border-b border-line">
              <span>
                {item.custom_place} · {item.size_code} · {item.frame_code}
              </span>
              <span>×{item.qty}</span>
            </div>
          ),
```

por:

```jsx
          ) : item.custom_location ? (
            <div key={i} className="py-4 border-b border-line text-sm">
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Ubicación</p>
              <p className="mb-2">{item.custom_place}</p>
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Tamaño</p>
              <p className="mb-2">{item.size_code}</p>
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Color</p>
              <p className="mb-2">{item.color_code}</p>
              <p className="font-label uppercase tracking-wide text-xs text-graphite/60">Marco</p>
              <p>{item.frame_code}</p>
            </div>
          ) : (
            <div key={i} className="py-2 flex justify-between font-label uppercase tracking-wide text-xs border-b border-line">
              <span>
                {item.custom_place} · {item.size_code} · {item.frame_code}
              </span>
              <span>×{item.qty}</span>
            </div>
          ),
```

- [ ] **Step 5: Push de `api/catalog.js` y `src/pages/OrderStatus.jsx`, verificación byte a byte**

---

### Task 13: Decisión explícita — infraestructura de lead-capture

**Files:** ninguno (decisión documentada, sin cambios de código)

- [ ] **Step 1: Confirmar la decisión en el PR**

`api/catalog.js`'s `postPersonalizeRequest`, la tabla `personalize_requests`, y `lib/alerts.js`'s `sendPersonalizeRequestNotification` (PR #208) quedan **sin uso, no eliminados** — cero costo de mantenerlos, y borrarlos requeriría además una migración de reversa de la tabla sin ningún beneficio real. El PR de este plan debe decir esto explícitamente en su descripción, para que quien lo revise no lo lea como un descuido.

---

## Self-Review (spec coverage)

- Checkout automático, no lead-capture → Tasks 4, 5, 11.
- +15% solo sobre tamaño → Task 2 (`getPersonalizedPrice`).
- `getPersonalizedPrice(size)` centralizada, misma fuente de verdad → Task 2 (corrige el spec original: la fuente de verdad real es `sizes.price_cents` en Supabase/`DUMMY_SIZES`, no `src/lib/catalog.js`'s `SIZES` — ese array no tiene precio).
- "Relieve personalizado / $Z MXN" sin desglose → Task 11 (paso resumen).
- Precio nunca sorpresa, se actualiza al cambiar tamaño → Task 11 (`useEffect` sobre `sizeCode`).
- Resumen completo (Ubicación/Tamaño/Color/Parota/Precio/Producción/Envío/Entrega) → Task 11.
- CTA exacto "Comprar mi Relieve" → Task 11.
- Preview no bloquea checkout, terreno 3D real vía Elevation API → Tasks 8, 10.
- Leyenda exacta del preview → Task 10 (`"Vista previa generada de tu terreno."`, sin mención de Ale, corregido en la conversación de brainstorming).
- Validación antes de pagar, mensaje exacto → Tasks 4 (server), 11 (cliente).
- "Tu Relieve está en marcha" post-compra → Task 12.
- Precio final persistido, no solo calculado al vuelo → Task 5 (`order_items.unit_price_cents`, columna ya existente).
- Reutiliza checkout/Stripe existente, sin checkout paralelo → Tasks 4, 5 (extienden `priceItem`/`createOrderFromSession`, no crean nada nuevo).
- Orden de pasos corregido (tamaño antes que ubicación, por el aspect-ratio del marco) → Task 11.
- Fuera de alcance respetado: catálogo (`Product.jsx`) sin cambios, sin generación automática de modelo 3D — ambos explícitos en Global Constraints y nunca tocados por ningún Task.

## Placeholder scan

Sin "TBD"/"TODO"/"similar a la Task N" en ningún Task — cada paso trae el código completo a escribir o el comando exacto a correr.

## Type consistency

`custom_location` shape (`place_id`/`formatted_address`/`latitude`/`longitude`/`map_bounds: {north,south,east,west}`/`zoom`) es idéntico en: la migración (Task 1, comentario), `assertValidCustomLocation` (Task 4), el objeto que `LocationPicker`'s `onConfirm` produce (Task 9), y el `addItem(...)` de `Personalize.jsx` (Task 11) — verificado campo por campo al escribir este plan.
