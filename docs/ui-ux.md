---
doc: ui-ux.md (v2 — enriquecido)
proyecto: Relieve — sitio web
version: 0.2
supera a: ui-ux.md v0.1 (13 jul) — este archivo es autocontenido, no hace falta cruzar ambos.
referencias: "Colores de la Marca", "Relieve — Brand Guidelines / Identidad Visual" (Doc 6, v1.1), "Hero Scroll (storyboard)", relieve-web-refs, relieve-motion.md, decisions.md (v2 — addendum 16 jul)
cambios en v2: escala tipográfica completa, dirección de fotografía en dos fases (render→foto real), estado de motion marcado como "listo para construir, no para seguir documentando".
---

# UI / UX

## Principios
Galería editorial + aeropuerto, cinematográfico, minimal, premium. **Ritmo luz↔sombra:** secciones oscuras cálidas (hero, reveals) contra galería clara (tienda). Copy en **español**, mínimo, **sin frases cursis**, coordenadas **reales o ninguna**. Nada de clichés de IA (aplicar anti-ai-design-slop).

## Rutas
- `/` — Home (hero scroll 3D → galería infinita → comprar por colección).
- `/coleccion/:slug` — colección (piezas + reseñas al fondo).
- `/pieza/:slug` — página de producto.
- `/personaliza` — ubicación personalizada (formulario).
- `/buscar` — buscador / índice A–Z.
- `/metodo-relieve` — proceso + manifiesto ("Sobre") + reseñas (2026-08-09: `/sobre` retirado, redirige aquí).
- `/envios`, `/faq`.
- `/carrito` — (o drawer).
- `/pedido/:token` — estado del pedido (magic link).

## Tokens de color
Usar exactamente los de **"Colores de la Marca"**. Claro: bg `#F6F3ED`, text `#232323`, blue `#B9CCD8`, sage `#AEB99E`, walnut `#7A5A43`, stone `#C8C3BC`, ink `#355A75`, navy `#22405C`, line `#E4DED3`. Cinemático oscuro: bg `#14110E`, text `#ECE7DD`. Nada de negro/blanco puros, neón, dorado, degradados.

## Tipografía — escala completa (nuevo en v2)

Tres familias, cada una con un rol fijo — no se mezclan funciones:

- **Fraunces** (serif editorial, variable, con italic) → titulares, wordmark, momentos "de marca".
- **Courier Prime** (mono tipo máquina de escribir) → etiquetas, specs, precios, coordenadas, sellos, nav. Siempre mayúsculas con tracking.
- **Inter** (sans neutra) → cuerpo de texto y UI funcional (botones, formularios, inputs).

**Regla de peso:** Fraunces se usa en weight Light/Regular (300–400), nunca Bold — el peso pesado rompe "silence communicates quality". Para énfasis dentro de un titular, usar *italic* de Fraunces, no bold. Courier Prime: Regular por default, Bold solo para el primer dato de una tabla de specs (ej. el precio). Inter: 400 cuerpo, 500 botones/labels de UI, 600 solo para H3.

| Nivel | Fuente / peso | Desktop | Mobile | Line-height | Tracking |
|---|---|---|---|---|---|
| Display (hero, act 1 del storyboard) | Fraunces 300 | `clamp(3.5rem, 4vw + 2rem, 6rem)` (56–96px) | `clamp(2.25rem, 8vw, 3rem)` (36–48px) | 1.05 | -0.02em |
| H1 (título de página/colección) | Fraunces 400 | `clamp(2.5rem, 3vw + 1.5rem, 3.5rem)` (40–56px) | 2rem (32px) | 1.1 | -0.01em |
| H2 (sección) | Fraunces 400 | 2rem–2.5rem (32–40px) | 1.5rem (24px) | 1.15 | -0.01em |
| H3 (subhead / kicker) | Inter 600, mayúsculas | 0.875rem–1rem (14–16px) | 0.8125rem (13px) | 1.3 | 0.10em |
| Cuerpo | Inter 400 | 1rem–1.125rem (16–18px) | 1rem (16px) | 1.6 | normal |
| Cuerpo pequeño / captions | Inter 400 | 0.875rem (14px) | 0.8125rem (13px) | 1.5 | normal |
| Etiquetas / specs / precio | Courier Prime, mayúsculas | 0.75rem–0.875rem (12–14px) | 0.75rem (12px) | 1.4 | 0.04–0.06em |
| Nav links | Courier Prime, mayúsculas | 0.8125rem–0.875rem (13–14px) | — (colapsa a menú) | 1.3 | 0.06em |
| Botón | Inter 500 | 0.875rem–0.9375rem (14–15px) | 0.875rem (14px) | 1 | 0.02em |

**Ancho de línea:** cuerpo limitado a 65–75ch (no full-width en desktop) — es principio editorial, no solo legibilidad.
**Implementación:** usar `clamp()` para los tamaños fluidos del display/H1 (evita saltos bruscos por breakpoint, más cinematográfico que un cambio discreto). El resto puede ser Tailwind con breakpoints normales.
**Jerarquía original (sin cambio):** Display/H1 Fraunces · H2 Fraunces · H3 Inter mayúsculas con tracking · Cuerpo Inter 16–18px, interlínea 1.6 · Etiquetas/precios Courier Prime 12–14px.

## Fotografía y dirección de arte (nuevo en v2 — ver decisions.md v2 §6)

**Fase 0 — lanzamiento (ahora):** catálogo con **renders**, siguiendo el tratamiento ya definido en Doc 6: acabado mate, fondo neutro, una sola fuente de luz, sombra suave, mismo tratamiento en todas las piezas. Distinto del modelo GLB interactivo del hero/producto (ese ya era render/3D por diseño, no cambia). Checklist antes de subir un render al catálogo: ¿tiene una sola fuente de luz? ¿fondo neutro sin saturar? ¿cero filtros/efectos? ¿se ve "de galería" o "de tienda"? Si la respuesta a la última es "de tienda", no se sube.

**Fase 1 — conforme haya piezas fotografiadas (empezando ~1 semana, cuando el marco de nogal esté listo):** Ángel de la Independencia y Gran Vía se fotografían con luz natural de ventana (mood de Doc 6: concreto, lino, madera, mármol; props sobrios; composición limpia, la pieza como protagonista; evitar fondos saturados, filtros fuertes, stock evidente, exceso de props) y reemplazan su render en `/pieza/:slug` y en galería. El swap es pieza por pieza, no hay que esperar el catálogo completo.

**Por qué la fase 1 importa y no es solo estética:** las primeras piezas fotografiadas son las que después funcionan como portafolio y testimonios reales — reforzar esto en el copy de esas fichas de producto cuando se reemplace el render (ej. mención de "primera pieza" o similar, sin caer en cursi).

## Sistema gráfico
"El pasaporte de los lugares": sellos tipo migratorio, curvas de nivel, coordenadas y altitud (msnm), etiquetas de archivo/baggage tags, lacre/sello, tablero de salidas — en Courier Prime, sutil, sobre papel.

## Hero — scroll 3D (pieza central)
Sección "pinned" con **R3F + GSAP ScrollTrigger + Lenis**. Ver **storyboard** completo. Etapas ligadas al scroll:
1. Ciudad aérea (vista superior) + logo "relieve" arriba-izquierda.
2. Una línea dibuja el **cuadro** de la sección a imprimir.
3. Textos se encogen/desaparecen; el fondo se borra.
4. El recorte se eleva; luz a **estudio potente**; la ciudad se vuelve **blanca** (3D impreso).
5. El **marco de nogal entra desde los 4 lados** y se ensambla.
6. **Giro dramático a vista lateral** (grosor/z). **Nunca la parte de atrás.**
7. Regresa a **vista frontal**.
8. Baja y se aleja → revela la **galería infinita** + buscador.
`prefers-reduced-motion` → versión por pasos con fades, sin coreografía.

## Componentes
- **Nav:** minimal, translúcida; wordmark izq; links en Courier Prime; se solidifica al hacer scroll; carrito.
- **Cursor custom:** punto que crece a pastilla contextual ("Ver destino").
- **Galería infinita:** piezas (vista superior con marco) sobre hueso; hairlines, sin sombras; radio 9px; **arrastra para rotar** (modelo 3D); controles a los bordes (menú/filtro abajo-centro, zoom abajo-derecha); **buscador "Encuentra tu lugar"** + índice A–Z.
- **Comprar por colección:** bloque media pantalla; cards con foto; hover zoom lento; clic → transición shared-element.
- **Card de colección / de pieza:** foto, nombre Fraunces, contador/kicker Courier Prime.
- **Página de producto (zine + Shupatto):** imagen grande (con **warp sutil al revelar**, estilo Shupatto) + columna de metadata; título Fraunces; **precio/medidas/msnm/coordenadas/SKU en Courier Prime**; selector de **tamaño** (Mediano "el más elegido") con roll numérico del precio; **personalización** (color/marco/orientación/placa/capelo) con **preview en vivo**; **bundle** como paso opcional; **tabla de especificaciones** minimal (hairlines, dos columnas, estilo Shupatto); **"Cómo llega / cómo se cuelga" en 3 pasos** con fotos; **acordeón** de detalles; **reseñas** (Disclosure: foto→clic→comentario); **preventa** → Spinning Text "pre-order"; **agotado** → Dialog waitlist. Un solo acento de acción (Navy/Passport Ink).
- **Carrito:** drawer estilo boarding pass (Courier Prime, perforados); opción "es un regalo".
- **Checkout:** redirección a Stripe (tarjeta/OXXO/MSI).
- **Página de estado:** tablero de salidas (paid→in_production→shipped→delivered).

## Motion — estado v2: listo para construir, no para seguir documentando

La spec de motion (abajo, sin cambios respecto a v1) más el inventario de componentes de `relieve-motion.md` (Accordion, Animated Tabs, Cursor con imagen, Dialog, Disclosure, Text Effect, Spinning Text — todos ya mapeados a sección y con theming Relieve) es **suficiente para empezar a construir**. Ale decidió (16 jul) que el siguiente paso no es agregar más spec escrita, sino ver algo corriendo en la página para evaluar si el motion es suficiente, falta o sobra.

**Siguiente paso recomendado:** ejecutar M1 (design tokens y tipografía) y M2 (hero 3D con scroll) del `backlog.md` — ya son P0 y ya están definidos — para tener un primer build tangible contra el cual decidir ajustes de motion. No bloquear M1/M2 esperando más documentación de motion.

**Specs de motion (sin cambio):**
- Curva reveal `cubic-bezier(0.2,0.6,0.2,1)` (600–900ms héroes, 200–320ms micro). Springs (`bounce 0.2`) para pills/cursor. Stagger 60–100ms. Scroll reveals = fade + translateY(16–24px).
- Transición de página: **sello de pasaporte estampándose**.
- Micro: botones invierten color en hover (200ms), active scale 0.98; links con subrayado que se dibuja; imágenes blur-up.
- Todo en `transform`/`opacity`. Respetar `prefers-reduced-motion`.
- Pendiente sin resolver (de `relieve-motion.md`, sección 3, no bloqueante): tablero de salidas split-flap, sello estampándose (video/Lottie por definir), boarding pass scan en checkout, parallax de curvas de nivel. Se retoman después de ver el build de M1/M2, no antes.

## Estados
- Loading (preload con sello estampándose), vacío (búsqueda sin resultados), error, **agotado** (waitlist), **preventa** (spinning), regalo.

## Responsive
- **Mobile-first.** En móvil el hero 3D usa una versión **ligera** (menos polígonos / o un render en video con poster) y respeta reduced-motion. Galería en 1–2 columnas. Controles adaptados al pulgar (≥44px).

## Accesibilidad
- Contraste AA (grafito/hueso cumple; cuidar terracota/azul sobre claro). Foco visible por teclado. `alt` descriptivo por lugar (bueno para SEO). `prefers-reduced-motion`. Sin autoplay con sonido.

## Reglas de copy
- Español (es-MX). Etiquetas y precios en Courier Prime mayúsculas. **Prohibido** copy cursi/terapéutico; **prohibido** mostrar el reverso del marco; coordenadas reales o ninguna; nunca exigir cuenta para comprar.
