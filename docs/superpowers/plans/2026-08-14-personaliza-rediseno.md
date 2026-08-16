# Rediseño UX/UI de /personaliza — Plan de implementación

> **Para ejecutores agénticos:** SUB-SKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para tracking.

**Objetivo:** Rediseñar la composición visual, jerarquía y micro-interacciones de `/personaliza` para que se sienta como una experiencia de diseño de producto ("elijo un lugar y veo cómo se convierte en objeto"), no como un formulario — sin tocar backend, pricing, APIs, ni el modelo de datos, que ya funcionan y están probados en producción.

**Arquitectura:** Los 3 mecanismos técnicos que ya funcionan (encuadre del mapa vía `Projection` en `LocationPicker.jsx`, pipeline de Elevation API en `TerrainPreview.jsx`/`terrainMesh.js`, contrato de `addItem()`/checkout en `CartContext.jsx`) se conservan **intactos en su lógica** — el trabajo es composición, layout, copy, feedback visual y una utilidad nueva de geometría (área/escala), todo cliente. `Personalize.jsx` se reescribe casi completo; `LocationPicker.jsx` y `TerrainPreview.jsx` se modifican (más espacio, más feedback, controles de órbita) sin tocar su lógica de datos.

**Tech Stack:** Igual que el resto del repo — Vite + React 19 + Tailwind v4 (CSS-first) + GSAP (`src/lib/animations.js`) + Three.js/`@react-three/fiber`/`drei` (ya instalados, `OrbitControls` de drei no se usa todavía en este archivo) + Google Maps JS API (ya cargada vía `googleMapsLoader.js`). Sin TypeScript. Tests: `node:assert` puro, igual que `terrainMesh.test.mjs`.

## Global Constraints

- **NO se toca:** `api/checkout.js`, `api/webhooks/stripe.js`, `api/catalog.js` (incluido `postPersonalizedPricing`), `lib/pricing.js`, ninguna migración de Supabase, `docs/database.md`/`docs/api.md`, el modelo de datos de `custom_location`/`order_items`. El contrato que `LocationPicker`'s `onConfirm` produce (`{place_id, formatted_address, latitude, longitude, map_bounds, zoom}`) y el que `Personalize.jsx`'s `handleBuy()` pasa a `addItem()` **no cambian de forma** — solo cuándo/cómo se muestran en pantalla.
- **NO se tocan valores de negocio:** tamaños (`chico`/`mediano`/`grande`/`especial`, 15×15/64×64/80×80/120×80cm), colores (`blanco`/`negromate`), `FRAMES[0]` (Parota Nacional, único marco), el +15% de `getPersonalizedPrice`, `PRODUCTION_DAYS`('10–15'), `SHIPPING_DAYS`('3–5'). Estos vienen de `src/lib/catalog.js`, ya confirmados por Ale — se importan, nunca se hardcodean de nuevo.
- **Textos exactos** (nuevos, del brief) — no parafrasear: hero `"Un lugar que es solo tuyo."` / `"Elige un lugar. Nosotros lo convertimos en relieve."`; buscador `"Busca una ciudad, dirección o lugar..."`; botón de encuadre `"Ver mi Relieve →"` (reemplaza "Confirmar ubicación" — ver nota en Task 2); historia `"¿Por qué este lugar?"` / `"Cuéntanos qué significa para ti."` / placeholder `"Ej. Aquí fue nuestro primer viaje juntos."` / `"Opcional"`; precio `"Incluye personalización de ubicación."` (nunca desglosar el 15% como número); CTA final `"Comprar mi Relieve"` (sin cambio); confirmación `"Relieve añadido al carrito"`.
- **Indicador de calidad de área — umbrales propuestos, no confirmados por Ale.** Ver Task 1: basados en la resolución REAL fija de la grilla de Elevation API (22×22 puntos, `TerrainPreview.jsx`'s `GRID_SIZE`), no en un número de marketing inventado. Marcados explícitamente como ajustables — mismo criterio que otros valores "aprobados a ojo, ajustar en preview" ya en el código (ej. el aclarado de `sello-navy` en dark mode).
- **Google Maps/Elevation ya cargados** vía `loadGoogleMaps()` (`src/lib/googleMapsLoader.js`) — no se agrega una segunda carga ni una nueva librería de mapas.
- **`@react-three/drei` ya está instalado** (dependencia del proyecto original de Personaliza) pero `TerrainPreview.jsx` no lo usa todavía — Task 3 lo usa por primera vez para `OrbitControls`.

---

## Qué se reutiliza tal cual (sin tocar)

| Pieza | Archivo | Por qué se conserva |
|---|---|---|
| Matemática de encuadre (`frameCornersToLatLng`, proyección de las esquinas del marco a lat/lng reales) | `LocationPicker.jsx` | Ya funciona, verificado en vivo contra la API real — es la única forma correcta de calcular `map_bounds` (no `map.getBounds()`, que da los bounds de TODO el div, no del marco) |
| Pipeline de Elevation API (`fetchHeightmapTexture`, caché por bounds, `buildElevationGrid`/`normalizeElevations`/`heightmapToTextureData`) | `TerrainPreview.jsx`, `terrainMesh.js` | Lógica de datos probada — Task 3 solo le agrega controles de cámara encima, no toca el fetch/textura |
| `StepProgress.jsx` | tal cual | Ya genérico, ya compartido con `Product.jsx`, sin cambios necesarios |
| `addItem()`/`CartContext.jsx` | tal cual | Contrato compartido con el resto del sitio — `Personalize.jsx` sigue llamándolo igual, solo agrega un estado local de confirmación ANTES de navegar |
| `.pill-glass`/`.pill-glass-active`/`.glass-card`, `Button.jsx`, `text-on-accent` | tal cual | Sistema de materiales ya arreglado (PR #211) — el rediseño usa estas clases, no inventa una segunda variante de "glass" |
| `googleMapsLoader.js`, `catalog.js` | tal cual | Sin cambios de datos |

## Qué NO existe todavía y hay que construir (confirmado por exploración, no hay nada reutilizable)

- Utilidad de área/escala geográfica (km², metros por muestra de la grilla) — no existe en ningún archivo del repo.
- Animación de "vuela al carrito" / confirmación de "agregado" — no existe (`src/lib/animations.js` tiene 11 funciones, ninguna de este tipo; búsqueda en todo el repo de `flyTo`/`cartBadge`/`successCheck`/`añadido` da 0 resultados).
- Patrón de CTA sticky en mobile — no existe una convención establecida (`Product.jsx` solo tiene `md:sticky` en la columna de fotos de desktop). Se construye siguiendo el patrón de "barra flotante que aparece/desaparece" que ya usa `Nav.jsx` (fixed + translate-y/opacity), no una convención nueva.
- `OrbitControls` en el preview 3D — `TerrainPreview.jsx` hoy tiene cámara fija, sin interacción.

---

## Diseño estructural — flujo nuevo

```text
┌─ HERO (mínimo, ~30vh) ───────────────────────────────┐
│  Un lugar que es solo tuyo.                          │
│  Elige un lugar. Nosotros lo convertimos en relieve. │
└───────────────────────────────────────────────────────┘

┌─ 01 — ELIGE TU LUGAR (full-bleed, ~85vh) ─────────────┐
│         [ Busca una ciudad, dirección o lugar... ]     │  ← buscador flotante SOBRE el mapa
│                                                        │
│                        MAPA                            │
│                  (90% del ancho disponible)             │
│                                                        │
│                 ┌───────────────┐                      │
│                 │  ÁREA A       │  ← marco fijo, mapa se mueve debajo
│                 │  RELIEVE      │                      │
│                 └───────────────┘                      │
│                                                        │
│        Área seleccionada · 2.1 × 2.1 km                │  ← discreto, bajo el marco
│        🟡 Amplia — acerca el mapa para más detalle      │  ← indicador de calidad (Task 1)
│                                                        │
│  Tamaño: [15×15] [64×64•] [80×80] [120×80]              │  ← ya elegido en el paso anterior del wizard
│  actual, se muestra aquí solo como recordatorio         │
│                                                        │
│                    [ Ver mi Relieve → ]                 │
└─────────────────────────────────────────────────────────┘
        ↓ transición 400–700ms (Task 4)
┌─ 02 — DALE FORMA ─────────────────────────────────────┐
│  Swatches de color (Blanco mate / Negro mate)          │
│  con preview 3D actualizándose en vivo                 │
└─────────────────────────────────────────────────────────┘
┌─ 03 — MIRA TU RELIEVE (preview 3D grande, rotable) ───┐
│  OrbitControls — arrastra para rotar, ve desde arriba   │
│  Marco de Parota Nacional visible (foto pequeña)        │
└─────────────────────────────────────────────────────────┘
┌─ 04 — HAZLO TUYO (historia, opcional) ────────────────┐
└─────────────────────────────────────────────────────────┘
┌─ 05 — TU RELIEVE (resumen + precio + CTA) ────────────┐
│  Precio · Producción 10–15 días · Envío gratis 3–5 días │
│  [ Comprar mi Relieve ]                                 │
└─────────────────────────────────────────────────────────┘
        ↓ animación de agregar (Task 5/6, OBLIGATORIA)
┌─ Mini-cart panel ──────────────────────────────────────┐
│  ✓ Relieve añadido al carrito                           │
│  [preview chico] París · 64×64cm · Negro mate · Parota  │
│  [ Ir al checkout ]  [ Seguir diseñando ]                │
└─────────────────────────────────────────────────────────┘
```

Orden de pasos: **tamaño se elige ANTES que ubicación** (como ya está hoy en `Personalize.jsx` — `STEPS` empieza en `'escala'`, luego `'ubicacion'`) — esto ya es lo que el brief pide para poder mostrar "esta selección funciona para tu Relieve de 64×64cm" mientras se encuadra, sin necesidad de reordenar el wizard existente.

---

## Task 1: `src/lib/geo.js` — área y calidad de detalle (matemática pura, testeable)

**Files:**
- Create: `src/lib/geo.js`
- Create: `src/lib/geo.test.mjs`
- Modify: `package.json` (agregar a `scripts.test`)

**Interfaces:**
- Produce:
  - `boundsWidthMeters(bounds): number` — ancho este-oeste en metros, medido en la latitud central del encuadre.
  - `boundsHeightMeters(bounds): number` — alto norte-sur en metros.
  - `boundsAreaKm2(bounds): number` — área aproximada del rectángulo, en km².
  - `metersPerElevationSample(bounds, gridSize = 22): number` — metros reales que representa cada punto de muestra de la grilla de Elevation API (el eje más ancho de los dos, porque la calidad del relieve la limita el eje menos denso).
  - `detailQuality(bounds, gridSize = 22): 'excelente' | 'amplia' | 'muy-amplia'` — clasifica `metersPerElevationSample` contra los umbrales de abajo.
- Consumido por: `LocationPicker.jsx` (Task 2).

- [ ] **Step 1: Escribir el test primero**

```js
// src/lib/geo.test.mjs
// Run: node src/lib/geo.test.mjs
import assert from 'node:assert';
import {
  boundsWidthMeters,
  boundsHeightMeters,
  boundsAreaKm2,
  metersPerElevationSample,
  detailQuality,
} from './geo.js';

// Encuadre real de referencia: ~1km × ~1km alrededor del centro de CDMX
// (north/south separados por ~0.009° de latitud ≈ 1km; east/west
// ajustado a la misma distancia real en esa latitud vía cos(lat)).
const oneKmBounds = { north: 19.4371, south: 19.4281, east: -99.1284, west: -99.1380 };

{
  const w = boundsWidthMeters(oneKmBounds);
  const h = boundsHeightMeters(oneKmBounds);
  // Tolerancia amplia (±15%) — haversine sobre un rectángulo pequeño,
  // no necesita precisión geodésica exacta para esta UI.
  assert.ok(Math.abs(w - 1000) < 150, `ancho esperado ~1000m, dio ${w}`);
  assert.ok(Math.abs(h - 1000) < 150, `alto esperado ~1000m, dio ${h}`);
}

{
  const area = boundsAreaKm2(oneKmBounds);
  assert.ok(Math.abs(area - 1) < 0.3, `área esperada ~1km², dio ${area}`);
}

{
  // 1000m de lado / 21 intervalos (gridSize 22) ≈ 47.6 m/muestra
  const mps = metersPerElevationSample(oneKmBounds, 22);
  assert.ok(Math.abs(mps - 47.6) < 10, `metros/muestra esperado ~47.6, dio ${mps}`);
  assert.strictEqual(detailQuality(oneKmBounds, 22), 'excelente');
}

{
  // Encuadre grande: ~5km de lado -> ~238 m/muestra -> muy-amplia
  const bigBounds = { north: 19.460, south: 19.415, east: -99.110, west: -99.155 };
  const mps = metersPerElevationSample(bigBounds, 22);
  assert.ok(mps > 150, `metros/muestra esperado >150, dio ${mps}`);
  assert.strictEqual(detailQuality(bigBounds, 22), 'muy-amplia');
}

{
  // Encuadre medio: ~2km de lado -> ~95 m/muestra -> amplia
  const midBounds = { north: 19.4416, south: 19.4236, east: -99.1188, west: -99.1476 };
  const quality = detailQuality(midBounds, 22);
  assert.strictEqual(quality, 'amplia');
}

console.log('geo.test.mjs: all assertions passed');
```

- [ ] **Step 2: Correr y confirmar que falla**

Run: `node src/lib/geo.test.mjs`
Expected: `Cannot find module './geo.js'` (el módulo no existe todavía)

- [ ] **Step 3: Implementar `src/lib/geo.js`**

```js
// Utilidad pura de geometría para /personaliza — convierte el encuadre
// (map_bounds, el mismo shape que LocationPicker.jsx ya produce y que
// assertValidCustomLocation ya valida server-side) a métricas que un
// cliente entiende: km² reales, y una calidad de detalle basada en la
// resolución REAL y fija de la grilla de Elevation API (GRID_SIZE=22 en
// TerrainPreview.jsx — mantener sincronizado si ese valor cambia). No es
// un número de marketing inventado: más área encuadrada con el mismo
// número de muestras (22×22, fijo) significa cada muestra cubre más
// metros reales, y el relieve final pierde definición — esto solo
// traduce esa relación a una etiqueta legible.
// docs/superpowers/plans/2026-08-14-personaliza-rediseno.md Task 1.

const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Distancia haversine entre 2 puntos lat/lng, en metros. Suficiente para
// un encuadre de unos pocos km — no necesita precisión geodésica de
// nivel topográfico para esta UI (solo informa al cliente, nunca se usa
// para pricing ni se manda al servidor).
function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// Ancho medido en la latitud central del encuadre (el ancho real en
// metros de un grado de longitud varía con la latitud — medir en el
// centro es la aproximación estándar para un rectángulo pequeño).
export function boundsWidthMeters(bounds) {
  const midLat = (bounds.north + bounds.south) / 2;
  return haversineMeters(midLat, bounds.west, midLat, bounds.east);
}

export function boundsHeightMeters(bounds) {
  return haversineMeters(bounds.north, bounds.west, bounds.south, bounds.west);
}

export function boundsAreaKm2(bounds) {
  const widthM = boundsWidthMeters(bounds);
  const heightM = boundsHeightMeters(bounds);
  return (widthM * heightM) / 1_000_000;
}

// El eje MÁS ANCHO de los dos, porque la calidad visual del relieve la
// limita el eje menos denso (si el encuadre es rectangular, no cuadrado).
export function metersPerElevationSample(bounds, gridSize = 22) {
  const widthM = boundsWidthMeters(bounds);
  const heightM = boundsHeightMeters(bounds);
  return Math.max(widthM, heightM) / (gridSize - 1);
}

// PROPUESTO — no confirmado por Ale, ajustar en preview si hace falta
// (mismo criterio que otros valores "a ojo" ya en el código, ej. el
// aclarado de sello-navy en dark mode, src/index.css). Basado en: por
// debajo de ~50m/muestra el relieve resuelve manzanas/edificios
// individuales con claridad; 50-150m sigue leyéndose bien pero pierde
// detalle fino; por arriba de 150m el relieve se ve borroso/genérico.
const QUALITY_THRESHOLDS_M = { excelente: 50, amplia: 150 };

export function detailQuality(bounds, gridSize = 22) {
  const mps = metersPerElevationSample(bounds, gridSize);
  if (mps < QUALITY_THRESHOLDS_M.excelente) return 'excelente';
  if (mps < QUALITY_THRESHOLDS_M.amplia) return 'amplia';
  return 'muy-amplia';
}
```

- [ ] **Step 4: Correr de nuevo y confirmar que pasa**

Run: `node src/lib/geo.test.mjs`
Expected: `geo.test.mjs: all assertions passed`

- [ ] **Step 5: Encadenar en `package.json`'s `scripts.test`**

Agregar `&& node src/lib/geo.test.mjs` junto a los demás `node src/lib/*.test.mjs` existentes (después de `node src/lib/terrainMesh.test.mjs`, mismo patrón que esa cadena ya sigue).

- [ ] **Step 6: Push y verificación byte a byte, commit**

---

## Task 2: `LocationPicker.jsx` — mapa protagonista + feedback de área/calidad

**Files:**
- Modify: `src/components/LocationPicker.jsx`

**Interfaces:**
- Consume: `boundsAreaKm2`, `boundsWidthMeters`, `boundsHeightMeters`, `detailQuality` (Task 1, `../lib/geo.js`).
- Nueva prop: `sizeLabel` (string, ej. `"64 × 64 cm"` — ya calculado por `Personalize.jsx` vía `formatDims`, se pasa como texto, este componente no conoce `catalog.js`).
- `onConfirm` — **mismo shape exacto que hoy**, sin cambios: `{ place_id, formatted_address, latitude, longitude, map_bounds, zoom }`. La UI cambia, el contrato no.

- [ ] **Step 1: Layout full-bleed — el contenedor deja de estar limitado a `max-w-lg`**

Reemplazar el `return` completo del componente. Los refs/estado/lógica de `useEffect`, `frameCornersToLatLng`, `handleConfirm` **no cambian** — solo el JSX de retorno y el estado nuevo para área/calidad (calculado en vivo mientras el mapa se mueve, no solo al confirmar).

Agregar, junto a los `useState` existentes:

```jsx
import { boundsAreaKm2, boundsWidthMeters, boundsHeightMeters, detailQuality } from '../lib/geo.js';
// ...
const [liveBounds, setLiveBounds] = useState(null);
```

En el `useEffect` de inicialización del mapa, agregar un listener de `'bounds_changed'` (o `'idle'`, para no recalcular en cada frame de arrastre — usar `'idle'`, que ya dispara al soltar/detener el mapa, mismo evento que ya usa el `addListenerOnce` existente pero sin el `once`) que recalcule el encuadre del marco cada vez que el mapa se mueve:

```jsx
maps.event.addListener(map, 'idle', () => {
  if (cancelled) return;
  setReady(true);
  setHasFramed(true);
  const bounds = frameCornersToLatLng(maps, map, overlay);
  setLiveBounds(bounds);
});
```

(Esto reemplaza el `addListenerOnce` de hoy — ahora corre en cada `'idle'`, no solo la primera vez, para que el área se actualice mientras el usuario mueve el mapa. `frameCornersToLatLng` ya existe sin cambios.)

Calcular la calidad derivada, dentro del componente (no en el render, para no recalcular si `liveBounds` no cambió — usar `useMemo`):

```jsx
const areaInfo = useMemo(() => {
  if (!liveBounds) return null;
  const areaKm2 = boundsAreaKm2(liveBounds);
  const widthKm = boundsWidthMeters(liveBounds) / 1000;
  const heightKm = boundsHeightMeters(liveBounds) / 1000;
  return { areaKm2, widthKm, heightKm, quality: detailQuality(liveBounds) };
}, [liveBounds]);

const QUALITY_COPY = {
  excelente: { emoji: '🟢', label: 'Excelente', detail: 'Esta zona tiene suficiente detalle para un relieve definido.' },
  amplia: { emoji: '🟡', label: 'Amplia', detail: 'Acerca el mapa para obtener mayor detalle.' },
  'muy-amplia': { emoji: '🔴', label: 'Demasiado amplia', detail: 'Esta zona no tendrá suficiente detalle. Acerca el mapa.' },
};
```

- [ ] **Step 2: JSX nuevo — buscador flotante, mapa full-bleed, marco con label, feedback de área**

```jsx
return (
  <div className="relative w-full">
    {loadError ? (
      <p className="text-sm text-graphite/70 p-8 text-center">{loadError}</p>
    ) : (
      <>
        {/* Buscador flotante SOBRE el mapa, no antes — apilado con z-index,
            mismo criterio visual que .pill-glass (fondo translúcido) para
            que se lea como parte del mapa, no como un input de formulario
            aparte. */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[min(90%,32rem)]">
          <div
            ref={searchDivRef}
            className="glass-card rounded-full px-2 py-1 [&_gmp-place-autocomplete]:w-full"
          />
        </div>

        {/* Mapa full-bleed — 80vh en vez de max-w-lg + aspect-ratio 4/3.
            El marco (frameRef) sigue siendo un elemento aparte encima,
            centrado, con la proporción del tamaño elegido — sin cambios
            en frameCornersToLatLng ni en cómo se calcula. */}
        <div className="relative w-full h-[80vh] min-h-[420px] max-h-[900px]">
          <div ref={mapDivRef} className="absolute inset-0 rounded-[9px] overflow-hidden" />
          <div
            ref={frameRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-gallery-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] pointer-events-none flex items-center justify-center"
            style={{ aspectRatio, width: aspectRatio === '3/2' ? '70%' : '46%' }}
          >
            <span className="font-label uppercase tracking-wide text-[11px] text-gallery-white/80">
              Área a relieve
            </span>
          </div>

          {areaInfo && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 glass-card rounded-[9px] px-4 py-2 text-center">
              <p className="font-label uppercase tracking-wide text-[11px] text-graphite/70">
                Área seleccionada · {areaInfo.widthKm.toFixed(2)} × {areaInfo.heightKm.toFixed(2)} km
              </p>
              <p className="text-xs mt-0.5">
                {QUALITY_COPY[areaInfo.quality].emoji} {QUALITY_COPY[areaInfo.quality].label}
                {' — '}
                <span className="text-graphite/60">{QUALITY_COPY[areaInfo.quality].detail}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
          {sizeLabel && (
            <p className="font-label uppercase tracking-wide text-xs text-graphite/50">
              Tamaño: {sizeLabel}
            </p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!ready || !hasFramed || !hasPlace || areaInfo?.quality === 'muy-amplia'}
            className="pill-glass-active text-on-accent px-8 py-3 rounded-[9px] font-heading font-bold disabled:opacity-40"
          >
            Ver mi Relieve →
          </button>
          {ready && !hasPlace && (
            <p className="text-sm text-graphite/70">Busca tu ubicación primero.</p>
          )}
        </div>
      </>
    )}
  </div>
);
```

Nota sobre el copy del botón: el brief original (secciones 1-24) dice `"Confirmar ubicación"`; el follow-up del mismo brief (sección final, "Y aquí entra el tamaño") pide explícitamente cambiarlo a `"Ver mi Relieve →"` porque expresa la consecuencia del click, no solo la acción. No hay contradicción con la lista "NO CAMBIAR" (esa lista protege precios/tamaños/producción/envío/marco/colores/backend, no copy de botones) — se usa `"Ver mi Relieve →"`.

Nota sobre el `disabled` nuevo (`areaInfo?.quality === 'muy-amplia'`): el brief pide explícitamente "el botón... solo se habilita cuando está en un rango válido" — esto bloquea confirmar un encuadre demasiado amplio. Client-side únicamente (UX), el servidor sigue sin conocer ni validar esta calidad — no es un cambio de validación de negocio, solo evita una mala experiencia antes de llegar al preview.

- [ ] **Step 3: Push y verificación byte a byte, commit**

(Sin test automatizado — depende de `window.google`/DOM real, mismo criterio que el resto de este archivo hoy.)

---

## Task 3: `TerrainPreview.jsx` — preview rotable, más grande

**Files:**
- Modify: `src/components/TerrainPreview.jsx`

**Interfaces:** sin cambios de props (`mapBounds`, `aspectRatio`, `colorHex`) ni de la lógica de fetch/textura — solo el `<Canvas>` crece y gana `OrbitControls`.

- [ ] **Step 1: Importar `OrbitControls` de drei, agregar al `<Canvas>`**

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
```

En el `return` de `TerrainPreview`, reemplazar el contenedor `w-full max-w-md` por uno más grande y agregar `<OrbitControls>` dentro del `<Canvas>`:

```jsx
<div className="w-full max-w-2xl mx-auto" style={{ aspectRatio }}>
  <Canvas camera={{ position: [0, 1.4, 1.8], fov: 45 }}>
    <ambientLight intensity={0.6} />
    <directionalLight position={[2, 3, 2]} intensity={1.2} />
    <TerrainMesh mapBounds={memoBounds} aspectRatio={aspectRatio} colorHex={colorHex} onError={setError} />
    {/* Rotación libre + zoom, sin pan (no tiene sentido alejar la pieza
        de su centro) — minAngle/maxAngle evitan voltear el relieve boca
        abajo o verlo de canto sin sentido. enableDamping = inercia suave
        al soltar, se siente menos "mecánico" que sin damping. */}
    <OrbitControls
      enablePan={false}
      minDistance={1}
      maxDistance={4}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping
      dampingFactor={0.08}
    />
  </Canvas>
</div>
```

- [ ] **Step 2: Confirmar que `@react-three/drei` está en `package.json`'s dependencies**

Run: `grep '"@react-three/drei"' package.json`
Expected: una línea con la versión ya instalada (dependencia existente del proyecto original de Personaliza — si por alguna razón no aparece, es un STOP, no se agrega una dependencia nueva sin confirmar con Ale primero).

- [ ] **Step 3: Push y verificación byte a byte, commit**

---

## Task 4: `Personalize.jsx` — reescritura completa de composición/copy/jerarquía

**Files:**
- Modify: `src/pages/Personalize.jsx` (reemplazo casi completo del JSX de retorno; el estado/lógica de precio, `isComplete`, `handleBuy` **no cambian de contrato**, solo se les agrega lo de Task 5/6)

**Interfaces:**
- Consume: `LocationPicker` (Task 2, con la nueva prop `sizeLabel`), `TerrainPreview` (Task 3), `StepProgress` (sin cambios), `formatDims`/`WALL_SIZES`/`COLORS`/`FRAMES`/`PRODUCTION_DAYS`/`SHIPPING_DAYS` (sin cambios).
- `handleBuy()` sigue construyendo el mismo objeto para `addItem()` — sin cambios de campos.

- [ ] **Step 1: Hero mínimo — reemplazar el encabezado actual**

Reemplazar:

```jsx
<h1 className="font-heading font-bold text-brand-dark text-3xl mb-2">Diseña tu Relieve</h1>
<p className="text-graphite/70 mb-8">
  Un lugar que es solo tuyo. Elige un lugar, nosotros lo convertimos en relieve.
</p>
```

por:

```jsx
<div className="text-center py-12 md:py-20">
  <h1 className="font-heading font-bold text-brand-dark text-[clamp(2rem,4vw+1rem,3.5rem)] leading-tight tracking-[-0.02em] mb-3">
    Un lugar que es solo tuyo.
  </h1>
  <p className="text-graphite/70 text-lg">
    Elige un lugar. Nosotros lo convertimos en relieve.
  </p>
</div>
```

(`tracking-[-0.02em]` en texto grande — mismo criterio que `Hero.jsx`/`Product.jsx` ya establecen, auditoría Apple Design del 14 ago 2026.)

- [ ] **Step 2: `<main>` deja de estar limitado a `max-w-lg` — full-bleed para el paso de mapa**

Cambiar el `<main>` de:

```jsx
<main className="max-w-lg mx-auto pt-32 px-8 pb-16">
```

a:

```jsx
<main className="pt-32 pb-16">
  <div className="max-w-5xl mx-auto px-4 md:px-8">
```

(el hero y los pasos que NO son mapa/preview quedan dentro de este `max-w-5xl`; el paso de mapa y el de preview 3D salen de este contenedor para ser verdaderamente full-bleed — ver Step 3. Cerrar el `</div>` extra antes del `</main>` al final del archivo.)

- [ ] **Step 3: Paso "escala" — encabezado numerado, sin cambios en la lógica de selección**

Reemplazar el `<legend>` de:

```jsx
<legend className="font-label uppercase tracking-wide text-xs mb-2">Elige tu escala</legend>
```

por un encabezado numerado consistente en los 6 pasos (mismo patrón en cada `activeStep`):

```jsx
<p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">01 — Elige tu escala</p>
<h2 className="font-heading font-bold text-2xl mb-6">¿Qué tamaño tendrá tu Relieve?</h2>
```

(El resto del fieldset, el `.map` de `WALL_SIZES`, las clases `pill-glass-active`/`pill-glass` — sin cambios.)

- [ ] **Step 4: Paso "ubicacion" — full-bleed, pasa `sizeLabel` a `LocationPicker`**

Reemplazar:

```jsx
{activeStep === 'ubicacion' && (
  <div className="mb-6">
    <p className="font-label uppercase tracking-wide text-xs mb-2">Elige tu lugar</p>
    <LocationPicker aspectRatio={aspectRatio} onConfirm={(loc) => { setLocation(loc); goNext(); }} />
  </div>
)}
```

por (nota: este bloque va FUERA del `max-w-5xl` — usar un `-mx-4 md:-mx-[calc((100vw-64rem)/2)]` o, más simple, sacar el `<div className="max-w-5xl...">` de alrededor solo para este paso mediante un fragmento condicional antes de cerrar el contenedor — ver Step 8 para cómo se resuelve la apertura/cierre del contenedor completo):

```jsx
{activeStep === 'ubicacion' && (
  <div className="mb-6">
    <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1 text-center">01 — Elige tu lugar</p>
    <LocationPicker
      aspectRatio={aspectRatio}
      sizeLabel={`${selectedSize?.label} — ${formatDims(selectedSize?.dims)}`}
      onConfirm={(loc) => { setLocation(loc); goNext(); }}
    />
  </div>
)}
```

- [ ] **Step 5: Paso "forma" — swatches con encabezado numerado (sin cambiar la lógica de color)**

Reemplazar el `<legend>` por:

```jsx
<p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">02 — Dale forma</p>
<h2 className="font-heading font-bold text-2xl mb-6">Color</h2>
```

(el `.map` de `COLORS`, los botones circulares con `backgroundColor: c.hex` — sin cambios de lógica, solo el encabezado arriba.)

Agregar, debajo de los swatches, el marco (siempre Parota, sin selector — brief sección 13):

```jsx
<div className="mt-6 flex items-center gap-3 p-3 rounded-[9px] bg-gallery-white">
  <div
    className="w-12 h-12 rounded-[6px] shrink-0"
    style={{ backgroundColor: FRAME.hex }}
    aria-hidden="true"
  />
  <div>
    <p className="font-label uppercase tracking-wide text-[10px] text-graphite/50">Marco</p>
    <p className="font-heading font-bold text-sm">{FRAME.label}</p>
  </div>
</div>
```

(Un swatch de color plano con el hex real de `FRAME` — no una fotografía real de la madera, porque no hay ningún asset de foto de Parota en el repo hoy y el brief pide no inventar contenido. Si Ale manda una foto real después, este bloque es el punto de reemplazo — dejar comentado en el código dónde iría.)

- [ ] **Step 6: Paso "preview" — usa el `TerrainPreview` agrandado (Task 3), encabezado numerado**

```jsx
{activeStep === 'preview' && location?.map_bounds && (
  <div className="mb-6 text-center">
    <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">03 — Mira tu Relieve</p>
    <h2 className="font-heading font-bold text-2xl mb-6">Así se verá</h2>
    <TerrainPreview mapBounds={location.map_bounds} aspectRatio={aspectRatio} colorHex={selectedColor?.hex} />
  </div>
)}
```

- [ ] **Step 7: Paso "historia" — encabezado numerado, sin cambiar la lógica del textarea**

```jsx
{activeStep === 'historia' && (
  <div className="mb-6">
    <p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">04 — Hazlo tuyo</p>
    <label className="flex flex-col gap-1">
      <span className="font-heading font-bold text-2xl mb-1">¿Por qué este lugar?</span>
      <span className="text-sm text-graphite/60 mb-3">
        Cuéntanos qué significa para ti. <span className="italic">Opcional</span>
      </span>
      <textarea
        value={story}
        maxLength={STORY_MAX_LENGTH}
        onChange={(e) => setStory(e.target.value)}
        placeholder="Ej. Aquí fue nuestro primer viaje juntos."
        className="border border-line rounded px-3 py-2"
      />
    </label>
  </div>
)}
```

- [ ] **Step 8: Paso "resumen" — encabezado numerado, copy del precio ajustado (sin cambiar el número)**

Reemplazar el `<h2>` interno y el bloque de precio:

```jsx
<p className="font-label uppercase tracking-wide text-xs text-graphite/50 mb-1">05 — Tu Relieve</p>
<h2 className="font-heading font-bold text-brand-dark text-2xl mb-4">Tu Relieve</h2>
{/* ...dl con Ubicación/Tamaño/Color/Marco, sin cambios... */}
<p className="font-heading font-bold text-brand-dark text-2xl mb-1">
  {unitPriceCents != null ? `$${(unitPriceCents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : '—'}
</p>
<p className="text-xs text-graphite/50 mb-4">Incluye personalización de ubicación.</p>
<p className="text-sm text-graphite/70">Producción · {PRODUCTION_DAYS} días</p>
<p className="text-sm text-graphite/70 mb-4">Envío gratis · {SHIPPING_DAYS} días después del envío</p>
```

(El número mostrado sigue siendo exactamente `unitPriceCents` — el mismo valor que ya calcula `getPersonalizedPrice` server-side, ya con el +15% aplicado. Solo se agrega la leyenda "Incluye personalización de ubicación." — nunca se muestra el 15% como número aparte, tal como pide el Global Constraint original del proyecto.)

- [ ] **Step 9: Cerrar el contenedor `max-w-5xl` correctamente alrededor del paso de mapa**

El paso `'ubicacion'` (Step 4) necesita renderizar FUERA del `<div className="max-w-5xl...">` para ser full-bleed, mientras los demás pasos quedan DENTRO. Reestructurar el `return` así (patrón: el contenedor angosto se abre/cierra condicionalmente alrededor de cada paso, no una vez para toda la página):

```jsx
return (
  <main className="pt-32 pb-16">
    <div className="max-w-5xl mx-auto px-4 md:px-8 text-center py-12 md:py-20">
      {/* hero, Step 1 */}
    </div>

    {activeStep === 'ubicacion' ? (
      <div className="w-full">{/* Step 4, full-bleed */}</div>
    ) : (
      <div className="max-w-lg mx-auto px-8">
        {/* escala / forma / preview / historia / resumen, Steps 3, 5-8 */}
      </div>
    )}

    <div className="max-w-lg mx-auto px-8">
      {/* StepProgress, sin cambios de posición */}
    </div>
  </main>
);
```

(`max-w-lg` para los pasos no-mapa, no `max-w-5xl` — el brief pide editorial/enfocado para esos pasos, full-bleed específicamente para el mapa y el preview 3D grande. `StepProgress` se queda angosto/centrado en todos los pasos, incluido el de mapa, para que Atrás/Continuar no floten sueltos en un ancho de 5xl.)

- [ ] **Step 10: Push y verificación byte a byte, commit**

(Sin test automatizado nuevo — página de UI completa, mismo criterio que el resto de páginas de este repo sin `.test.mjs`. Verificar con `npm run build` que no hay errores de sintaxis/import, y revisión visual en preview antes de mergear.)

---

## Task 5: `src/lib/animations.js` — animación de "agregado al carrito" (OBLIGATORIA)

**Files:**
- Modify: `src/lib/animations.js`

**Interfaces:**
- Produce: `addedToCartPulse(el)` — pulso de confirmación corto sobre el botón/tarjeta que se acaba de agregar. Consumido por `Personalize.jsx` (Task 6).

- [ ] **Step 1: Agregar la función, siguiendo el patrón ya establecido de las demás (guard de `prefers-reduced-motion`, GSAP timeline)**

```js
// docs/superpowers/plans/2026-08-14-personaliza-rediseno.md Task 5 —
// confirmación de "agregado al carrito", mismo criterio de reduced-motion
// que orderSummaryCardEnter/tilePopIn ya usan en este archivo. Un pulso
// de escala + un breve destello de color en vez de una animación literal
// de "vuela al ícono del carrito" — FluidMenu.jsx (donde vive el botón
// del carrito) no siempre está visible/montado en pantalla cuando el
// usuario compra desde /personaliza (vive dentro de un panel que se abre
// aparte), así que animar un vuelo hacia un elemento que puede no existir
// en el DOM en ese momento sería frágil. El pulso vive en el propio botón
// de compra — inmediato, visible, sin depender de otro componente.
export function addedToCartPulse(el) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!el) return;
  gsap.fromTo(
    el,
    { scale: 1 },
    {
      scale: reduced ? 1 : 1.06,
      duration: reduced ? 0.01 : 0.18,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    },
  );
}
```

- [ ] **Step 2: Push y verificación byte a byte, commit**

(Sin test automatizado — animación pura sobre un elemento DOM, mismo criterio que el resto de `animations.js`, que no tiene `.test.mjs`.)

---

## Task 6: Mini-cart de confirmación en `Personalize.jsx`

**Files:**
- Modify: `src/pages/Personalize.jsx`

**Interfaces:**
- Consume: `addedToCartPulse` (Task 5).
- No modifica `CartContext.jsx` ni `CartDrawer.jsx` — el panel de confirmación es estado LOCAL de `Personalize.jsx`, la llamada a `addItem()` sigue siendo exactamente la misma.

- [ ] **Step 1: Agregar estado local de confirmación y ref al botón de compra**

```jsx
const [justAdded, setJustAdded] = useState(false);
const buyBtnRef = useRef(null);
```

(Agregar `useRef` al import de React ya existente en la primera línea del archivo.)

- [ ] **Step 2: `handleBuy` dispara el pulso y muestra el mini-cart ANTES de navegar — nunca navega en silencio**

Reemplazar el final de `handleBuy()` (la llamada a `addItem(...)` y el `navigate('/')` que la sigue):

```jsx
function handleBuy() {
  if (!isComplete) return;
  addItem({
    // ...mismo objeto exacto de hoy, sin cambios de campos...
  });
  addedToCartPulse(buyBtnRef.current);
  setJustAdded(true);
  // Nota: ya NO se navega a '/' inmediatamente — el mini-cart de abajo
  // decide cuándo navegar (checkout) o si el usuario prefiere seguir en
  // esta página ("Seguir diseñando"). CartContext.addItem() ya sigue
  // abriendo el CartDrawer completo por su cuenta (setIsOpen(true),
  // sin cambios) — este panel es un mensaje inmediato ADEMÁS de eso,
  // no en su lugar.
}
```

- [ ] **Step 3: Agregar el `ref` al botón de compra y el panel de confirmación**

En el `finalAction` de `StepProgress`, agregar `ref={buyBtnRef}` al botón existente (sin cambiar sus demás props/clases/texto).

Justo después del cierre de `<StepProgress ... />`, agregar el panel (aparece solo cuando `justAdded` es true):

```jsx
{justAdded && (
  <div className="fixed inset-0 z-[200] bg-graphite/40 flex items-center justify-center p-4" onClick={() => setJustAdded(false)}>
    <div
      className="glass-card rounded-[9px] p-6 max-w-sm w-full text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-2xl mb-2">✓</p>
      <h3 className="font-heading font-bold text-xl mb-4">Relieve añadido al carrito</h3>
      <dl className="text-sm text-left space-y-1 mb-6">
        <div className="flex justify-between">
          <dt className="text-graphite/60">Ubicación</dt>
          <dd>{location?.formatted_address}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-graphite/60">Tamaño</dt>
          <dd>{formatDims(selectedSize?.dims)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-graphite/60">Color</dt>
          <dd>{selectedColor?.label}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="pill-glass-active text-on-accent px-6 py-3 rounded-[9px] font-heading font-bold"
        >
          Ir al checkout
        </button>
        <button
          type="button"
          onClick={() => setJustAdded(false)}
          className="text-sm text-graphite/60 underline"
        >
          Seguir diseñando
        </button>
      </div>
    </div>
  </div>
)}
```

("Ir al checkout" navega a `/` — el mismo destino que hoy, porque ahí es donde vive `CartDrawer`/el flujo real de pago; no existe una ruta `/checkout` separada en este repo. "Seguir diseñando" solo cierra el panel, el usuario se queda en `/personaliza` con su configuración intacta — no resetea el wizard.)

- [ ] **Step 4: Push y verificación byte a byte, commit**

---

## Task 7: Responsive / mobile

**Files:**
- Modify: `src/pages/Personalize.jsx`
- Modify: `src/components/LocationPicker.jsx`

**Interfaces:** sin cambios — solo clases responsive agregadas a lo que Tasks 2/4 ya construyeron.

- [ ] **Step 1: `LocationPicker.jsx` — mapa sigue siendo protagonista en mobile, altura ajustada**

Cambiar `h-[80vh] min-h-[420px] max-h-[900px]` (Task 2, Step 2) a:

```jsx
className="relative w-full h-[70vh] md:h-[80vh] min-h-[360px] md:min-h-[420px] max-h-[900px]"
```

(70vh en mobile en vez de 80vh — deja algo más de espacio visible para el buscador flotante arriba y el botón de confirmar abajo en pantallas cortas, sin reducir el mapa a "miniatura".)

- [ ] **Step 2: `Personalize.jsx` — CTA final sticky en mobile**

En el paso `'resumen'` (Task 4, Step 8), envolver el botón de `finalAction` dentro de `StepProgress` — el cambio real va en cómo se renderiza `StepProgress` para ese paso específico. Agregar, en el `<div className="max-w-lg mx-auto px-8">` que envuelve `StepProgress` (Task 4, Step 9), la variante sticky solo para el último paso:

```jsx
<div className={`max-w-lg mx-auto px-8 ${isLastStep ? 'md:static sticky bottom-0 bg-gallery-white pt-4 pb-6 -mx-8 px-8 border-t border-line md:border-t-0 md:bg-transparent md:pb-0' : ''}`}>
  {/* StepProgress, sin cambios internos */}
</div>
```

(Seguido el mismo patrón de "barra flotante fixed/sticky con fondo sólido" que `Nav.jsx` ya usa para su propio scroll-shrink, adaptado a `sticky` en vez de `fixed` porque este bloque vive dentro del flujo normal del documento, no superpuesto a todo el viewport.)

- [ ] **Step 3: Push y verificación byte a byte, commit**

---

## Task 8: Verificación final del flujo completo

**Files:** ninguno (solo verificación, sin cambios de código)

- [ ] **Step 1:** `npm test` (todas las suites, incluyendo `geo.test.mjs` nuevo) — exit 0.
- [ ] **Step 2:** `npm run build` — exit 0, sin errores de import/sintaxis.
- [ ] **Step 3:** Verificación visual en preview de Vercel, con una API key real de Google Maps ya configurada (ya existe en el proyecto desde el trabajo anterior de Personaliza) — recorrer el flujo completo: buscar lugar → encuadrar → ver área/calidad en vivo → "Ver mi Relieve →" → color → preview 3D rotable con `OrbitControls` → historia opcional → resumen con precio correcto → "Comprar mi Relieve" → pulso + mini-cart → "Ir al checkout" abre el carrito real con el item correcto.
- [ ] **Step 4:** Confirmar en el mini-cart y en `CartDrawer` que el objeto agregado tiene exactamente los mismos campos que agrega hoy (`custom_place`, `custom_location`, `name`, `unit_price_cents`, `qty`, `size_code`, `frame_code`, `color_code`, `orientation`, `memory_note`) — ningún campo nuevo, ninguno faltante.
- [ ] **Step 5:** Confirmar que `api/checkout.js`, `api/webhooks/stripe.js`, `lib/pricing.js`, ninguna migración de Supabase, aparecen en el diff de la rama — `git diff --stat main` no debe listar ninguno de esos archivos.

---

## Self-review (cobertura del brief)

- Hero mínimo, editorial, sin párrafos → Task 4 Step 1.
- Mapa protagonista, ~80-90vh, full-bleed → Task 2 Step 1-2, Task 4 Step 9.
- Marco fijo, mapa se mueve debajo → ya existente en `frameCornersToLatLng`/`frameRef`, sin cambios de lógica; Task 2 le agrega el label "Área a relieve".
- Buscador flotante sobre el mapa → Task 2 Step 2.
- Info de área discreta mientras se mueve el mapa → Task 2 Step 1-2 (`liveBounds` en cada `'idle'`).
- "Confirmar ubicación" con feedback real → Task 2 Step 2 (copy nuevo, `disabled` por calidad, validación existente sin tocar).
- Transición mapa→preview 400-700ms → Task 4 (transición entre pasos ya la maneja `StepProgress`/`goNext`, que usa CSS `transition-colors duration-300` — dentro del rango pedido, sin necesidad de una animación nueva).
- Preview 3D protagonista, rotable → Task 3.
- Historia opcional, copy exacto → Task 4 Step 7.
- Color con swatches, no dropdown → ya existente, sin cambios de lógica; Task 4 Step 5 solo agrega encabezado + bloque de marco.
- Tamaño con precio actualizado → ya existente (`useEffect` de pricing sin cambios); Task 4 Step 3 solo agrega encabezado.
- Parota sin selector, mostrada como parte de la config → Task 4 Step 5.
- Preview final grande antes de comprar → Task 4 Step 6 (usa el `TerrainPreview` agrandado de Task 3).
- Precio sin desglosar el 15% → Task 4 Step 8 (copy nuevo, mismo número).
- Producción/envío junto al precio → Task 4 Step 8 (ya existente, solo reordenado/reescrito el copy).
- Animación de agregar al carrito OBLIGATORIA → Task 5 + Task 6.
- Mini-cart con preview + Ir al checkout / Seguir diseñando → Task 6 Step 3.
- Mobile: mapa protagonista, CTA sticky → Task 7.
- Área con "calidad de detalle" y umbrales → Task 1 (marcados explícitamente como propuesta, no confirmados).
- Escala física del encuadre (km) → Task 2 Step 1-2 (`widthKm`/`heightKm` en el mismo bloque de área).

## Placeholder scan

Sin "TBD"/"TODO"/"similar a la Task N" — cada paso trae el código completo a escribir. Única excepción explícita y marcada: los umbrales de `QUALITY_THRESHOLDS_M` (Task 1) están señalados como propuesta técnica, no como decisión de negocio confirmada — ya lo pediste así.

## Type consistency

`map_bounds` (`{north,south,east,west}`) es el mismo shape en `LocationPicker.jsx` (ya existente), `geo.js` (Task 1, lo consume), y `TerrainPreview.jsx` (ya existente) — verificado campo por campo. `sizeLabel` (Task 2, nueva prop) es un string ya formateado por `Personalize.jsx` vía `formatDims` — `LocationPicker.jsx` nunca importa `catalog.js` directamente, mismo criterio de separación que ya existe hoy.
