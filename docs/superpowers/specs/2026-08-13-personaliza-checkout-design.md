# /personaliza — checkout automático (rediseño)

## Contexto

`/personaliza` (Personalize.jsx) es hoy un formulario de lead-capture: el
cliente escribe el lugar que quiere, y Ale lo contacta por correo para
cotizar y decidir si es fabricable (PR #208, recién mergeado a `main`).
Esta spec lo reemplaza por completo con un flujo de **compra inmediata**:
el cliente elige tamaño, ubica su lugar en un mapa, elige color, ve un
preview 3D real de su terreno y compra ahí mismo, con el checkout de
Stripe que el sitio ya usa para el catálogo.

**Decisión de negocio (confirmada por el usuario, quien releva a Ale)**:
esto elimina fricción — diseñar → ver precio → comprar, sin intermediario
humano en el camino de compra. El recargo de personalización es fijo
(+15% sobre el precio base del tamaño), calculado y visible desde que se
elige tamaño, nunca como sorpresa al final.

## Alcance

Reemplaza **solo** `/personaliza` (lugares fuera del catálogo). El
catálogo curado existente (Barcelona, Ciudad de México, etc., con
fotografía/GLB real y el configurador simplificado en PR #207) **no se
toca** — sigue siendo su propio camino de compra, con su propia página de
producto. Son dos formas de comprar que coexisten.

## Flujo

Orden confirmado (revisado durante el diseño — ver "Decisión: orden de
pasos" abajo):

```
01 — Elige tu escala      (tamaño: define la proporción del marco de encuadre)
02 — Elige tu lugar       (buscar con Google Places → mover/zoom mapa → encuadrar → confirmar)
03 — Dale forma           (color: blanco mate / negro mate)
Preview                   (terreno 3D real renderizado en vivo)
Historia (opcional)
Resumen — "Tu Relieve"
Comprar mi Relieve → checkout/Stripe existente → Pedido confirmado
```

### Decisión: orden de pasos (tamaño antes que ubicación)

El documento original del usuario proponía ubicación → color → tamaño.
Los tamaños reales tienen dos proporciones distintas: 15×15/64×64/80×80
son 1:1, 120×80 es 3:2. Si el marco de encuadre del mapa tiene una
proporción fija, tiene que conocerse **antes** de que el cliente encuadre
— si no, el cliente podría encuadrar algo con una proporción que luego,
al elegir 120×80, ya no coincide con lo que enmarcó. Se resolvió moviendo
"elige tu escala" al primer paso. El resto del flujo (color, preview,
historia, resumen) no depende de este cambio.

## 1 — Mapa y selector de ubicación

**Componente nuevo**: `src/components/LocationPicker.jsx`.

- **Búsqueda**: Google Maps JavaScript API + Places (`PlaceAutocompleteElement`
  — la API vigente, no el `Autocomplete` legacy que Google deprecó).
- **Mapa**: Google Maps JavaScript API estándar, interactivo (pan + zoom).
- **Encuadre**: un marco fijo se dibuja sobre el mapa, con
  `aspect-ratio: 1/1` o `3/2` según el tamaño elegido en el paso 01. El
  marco no se mueve ni se redimensiona — el cliente arrastra/hace zoom al
  mapa por debajo de él, como encuadrar una foto de perfil.
- **Datos capturados al confirmar**:
  - `place_id`, `formatted_address`, `place_name` (de Places)
  - `latitude` / `longitude` (centro del marco)
  - `zoom` (nivel de zoom de Google Maps en ese instante)
  - `map_bounds` (`getBounds()` de la API en el instante de confirmar —
    el rectángulo geográfico real que quedó dentro del marco)
- **`selected_area` del documento original se descarta** como campo
  independiente: `map_bounds` ya da el rectángulo geográfico exacto:
  calcular un "área" aparte sería redundante y una fuente más de
  inconsistencia entre los dos valores.

**Costo**: Maps JavaScript API + Places API, dentro de la cuenta de
Google Cloud con facturación que el usuario ya confirmó que Ale va a
activar. Con el tráfico actual del sitio cae dentro de la cuota gratis
mensual, pero es una cuenta con facturación activa desde el día uno.

## 2 — Preview: terreno 3D real

**Componente nuevo**: `src/components/TerrainPreview.jsx`, con
`@react-three/fiber` (mismo stack que ya usa el hero — sin dependencia
nueva).

- Al confirmar el encuadre (fin del paso 02), se llama a **Google
  Elevation API** con una grilla de muestras (ej. 32×32) dentro de
  `map_bounds`.
- La grilla se normaliza a una textura de alturas y se usa como
  `displacementMap` sobre un plano en Three.js — un DEM real, no un
  efecto simulado a ojo.
- **Material**: iluminación direccional + material mate (`roughness`
  alto, sin brillo), coloreado según blanco/negro mate elegido en el
  paso 03 — mismo lenguaje "acabado mate" del resto de la marca
  (ui-ux.md). El plano se recorta a la proporción del tamaño elegido.
- **Leyenda fija bajo el preview**: **"Vista previa generada de tu
  terreno."** — sin mención de Ale ni de variación en el acabado final
  (corregido durante el diseño; el documento original tenía una versión
  más larga que se descartó).
- **Cache**: por `place_id` + `map_bounds` redondeados, para no volver a
  llamar Elevation API si el cliente regresa a ajustar el encuadre — cada
  llamada tiene un costo real, aunque pequeño, en la misma cuenta de
  Google Cloud.
- **Riesgo de ingeniería, marcado explícitamente**: esta es la pieza más
  compleja de todo el feature (grilla → heightmap → mesh en tiempo real,
  con buen desempeño en celulares). Si en la práctica se ve pobre o lenta,
  el plan B (imagen estática del mapa dentro de un mockup de marco en
  CSS/HTML, sin Three.js) queda documentado aquí como fallback, no
  descartado — se decide con datos reales de la primera implementación,
  no de antemano.

## 3 — Precio

**`getPersonalizedPrice(sizeCode)`** — nueva función en
`src/lib/catalog.js`, junto a `SIZES` (misma fuente de verdad que ya usa
el resto del sitio, no una tabla de precios nueva):

```js
export function getPersonalizedPrice(sizeCode) {
  const size = SIZES.find((s) => s.code === sizeCode);
  if (!size) return null;
  return Math.round(size.price_cents * 1.15);
}
```

- El 15% se calcula **solo sobre el precio base del tamaño** — nunca
  sobre marco (siempre Parota Nacional, sin costo extra) ni sobre color
  (blanco/negro mate, sin costo extra) — corrección explícita del usuario
  sobre el documento original, que no distinguía esto.
- Redondeo a entero (centavos MXN).
- Se recalcula cada vez que cambia el tamaño; el resumen se actualiza al
  instante — visible desde el primer paso, nunca como sorpresa al final.

**Presentación visual** (resumen): no se muestra como desglose de cargo
("Precio base / +15% / Total"). Se muestra directo como:

> **Relieve personalizado**
> **$Z MXN**

## 4 — Modelo de datos y checkout

- **Una columna nueva**, no seis sueltas: `order_items.custom_location
  jsonb`, nullable. Contiene `place_id` / `formatted_address` /
  `latitude` / `longitude` / `map_bounds` / `zoom`. La mayoría de los
  pedidos (catálogo) nunca la usan — una columna sparse en vez de seis
  columnas casi siempre vacías.
- `order_items.custom_place` (ya existe en el schema) sigue guardando el
  nombre legible del lugar, igual que hoy.
- `frame_code` siempre `'parota'` para piezas personalizadas — sin
  addons de marco/color, el 15% ya cubre todo.
- **El precio final queda guardado, no solo calculado al vuelo**:
  `order_items.unit_price_cents` (columna existente, `not null`, la que
  ya usa cualquier item de catálogo) recibe el resultado de
  `getPersonalizedPrice()` en el momento del pago — mismo campo, mismo
  mecanismo que cualquier otro pedido, disponible después para
  factura/consulta vía `GET /api/orders/:token` (ya existente). El precio
  *base* (antes del 15%) no se guarda aparte — es recuperable siempre
  desde `SIZES` por `size_code`, mismo principio que ya aplica hoy: los
  deltas de precio de `frame_code`/`color_code` tampoco se guardan por
  separado en `order_items`.
- **`api/checkout.js`**: `priceItem()` ya acepta `custom_place` como
  alternativa a `place_slug` (soporte parcial preexistente, nunca antes
  conectado a una UI real). Se extiende para leer `custom_location` +
  `size_code` + `color_code` cuando el item viene marcado como
  personalizado, y calcular con `getPersonalizedPrice()` en vez de
  `calcUnitPriceCents()`. Reutiliza la misma Stripe Checkout Session que
  ya existe — sin checkout paralelo.
- **Para que Ale pueda producir la pieza**: `sendOrderPaidNotification`
  (lib/alerts.js — el correo que Ale ya recibe por cada pedido pagado) se
  extiende para mostrar ubicación/coordenadas/bounds legibles cuando el
  item es personalizado. Ale sigue produciendo cada pieza a mano, como
  hoy con todo el catálogo (docs/decisions.md: "Modelo 3D real (GLB): lo
  produce Ale") — esto es lo mínimo que necesita ver para saber qué
  terreno tallar. No hay generación automática de modelo/STL en este
  proyecto.

## 5 — Validación, resumen y confirmación

**Validación antes de pagar** (botón "Comprar mi Relieve" deshabilitado
hasta cumplir todo): `place_id` + `map_bounds` válidos, `size_code`
válido, `color_code` válido, precio calculado. Si falta algo:

> **Completa tu Relieve para continuar.**

No se permite avanzar a checkout con un pedido incompleto.

**Resumen — "Tu Relieve"**:

```
Ubicación
Tamaño
Color
Parota nacional

Relieve personalizado
$Z MXN

Producción: 10–15 días
Envío: Gratis
Entrega: 3–5 días después del envío

[ Comprar mi Relieve ]
```

**Historia opcional** (antes del resumen): un textarea simple que escribe
a la misma columna `order_items.memory_note` que el configurador del
catálogo ya usa para "por qué esta pieza importa" — no es un campo nuevo,
ni el mismo campo que `plate_text` (ese es la placa grabada física, un
addon pagado que no aplica aquí). Mismo límite de caracteres server-side
que `memory_note` ya tiene hoy (`api/checkout.js`'s `FREE_TEXT_LIMITS`).

**Confirmación post-compra**: reutiliza `OrderStatus.jsx` (ya existe, ya
muestra pedidos por `status_token`) con una variante para pedidos
personalizados:

> **Tu Relieve está en marcha.**

Mostrando ubicación / tamaño / color / Parota nacional / precio /
producción / envío. El sistema de seguimiento ya existente
(`/pedido/:token`) queda disponible desde el correo de confirmación,
igual que con cualquier otro pedido.

## Fuera de alcance de esta spec

- El configurador del catálogo curado (Product.jsx) — no se toca.
- Generación automática de modelo 3D/STL — no existe en este proyecto, no
  se construye aquí. Ale sigue produciendo a mano.
- Restricción geográfica de búsqueda — el catálogo ya incluye ciudades de
  varios países (París, Shanghái, Londres), así que la búsqueda de
  lugares no se limita a México.
