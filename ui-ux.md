---
doc: ui-ux.md
proyecto: Relieve — sitio web
version: 0.1
referencias: "Colores de la Marca", "Hero Scroll (storyboard)", relieve-web-refs, relieve-motion
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
- `/sobre` — manifiesto + proceso.
- `/envios`, `/faq`.
- `/carrito` — (o drawer).
- `/pedido/:token` — estado del pedido (magic link).

## Tokens y tipografía
Usar exactamente los de **"Colores de la Marca"**. Claro: bg `#F6F3ED`, text `#232323`, blue `#B9CCD8`, sage `#AEB99E`, walnut `#7A5A43`, stone `#C8C3BC`, ink `#355A75`, navy `#22405C`, line `#E4DED3`. Cinemático oscuro: bg `#14110E`, text `#ECE7DD`. Fuentes: **Fraunces** (titulares), **Courier Prime** (etiquetas/precios/coordenadas/specs, mayúsculas), **Inter** (cuerpo/UI). Nada de negro/blanco puros, neón, dorado, degradados.

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

## Motion (specs)
- Curva reveal `cubic-bezier(0.2,0.6,0.2,1)` (600–900ms héroes, 200–320ms micro). Springs (`bounce 0.2`) para pills/cursor. Stagger 60–100ms. Scroll reveals = fade + translateY(16–24px).
- Transición de página: **sello de pasaporte estampándose**.
- Micro: botones invierten color en hover (200ms), active scale 0.98; links con subrayado que se dibuja; imágenes blur-up.
- Todo en `transform`/`opacity`. Respetar `prefers-reduced-motion`.

## Estados
- Loading (preload con sello estampándose), vacío (búsqueda sin resultados), error, **agotado** (waitlist), **preventa** (spinning), regalo.

## Responsive
- **Mobile-first.** En móvil el hero 3D usa una versión **ligera** (menos polígonos / o un render en video con poster) y respeta reduced-motion. Galería en 1–2 columnas. Controles adaptados al pulgar (≥44px).

## Accesibilidad
- Contraste AA (grafito/hueso cumple; cuidar terracota/azul sobre claro). Foco visible por teclado. `alt` descriptivo por lugar (bueno para SEO). `prefers-reduced-motion`. Sin autoplay con sonido.

## Reglas de copy
- Español (es-MX). Etiquetas y precios en Courier Prime mayúsculas. **Prohibido** copy cursi/terapéutico; **prohibido** mostrar el reverso del marco; coordenadas reales o ninguna; nunca exigir cuenta para comprar.
