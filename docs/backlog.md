---
doc: backlog.md
proyecto: Relieve — sitio web
uso: Epic → Issues → sub-issues, listo para crear en GitHub (o alimentar a Claude Code).
fuente: architecture.md, database.md, api.md, ui-ux.md
estado: SUPERADO — ver nota abajo
---

# ⚠️ Superado por GitHub Issues (2026-07-16)

Este archivo fue el punto de partida propuesto. Claude Code ya lo reconcilió con
`decisions.md` (autoritativo) y lo convirtió en el backlog real en GitHub:

- **16 epics** (`#1`–`#16`, label `epic`) + **68 issues hijos**, 84 issues en total.
- Reconciliado con `decisions.md`: Supabase (no Postgres genérico), Vercel serverless
  (no Netlify), Facturama (no SW/Bind), precios en **centavos** en todos los campos.
- 2 epics nuevos que no estaban aquí: **Legal & compliance pages** y
  **Observability & alerting** (gaps que `decisions.md` señalaba sin resolver).
- Sub-issues nativos de GitHub (parent–child), no checkboxes.
- Cada issue tiene una sección `## Blocked-by` con las dependencias reales, y el
  label `ready` marca lo que se puede empezar ya (por ahora: el schema de Supabase
  y el scaffold del frontend).

**La fuente de verdad ahora es GitHub Issues**, no este archivo. Este archivo se
conserva como referencia histórica de la propuesta original — no lo uses para
priorizar o secuenciar trabajo.

👉 Ver: https://github.com/alexaarenash19-cmyk/relieve-web/issues

---

# EPIC — Relieve — Sitio web v1

**Meta:** tienda made-to-order con hero cinematográfico 3D ligado al scroll y checkout premium (Stripe), en español, mercado México.
**Criterios de éxito:** un usuario puede descubrir una pieza, personalizarla, comprar (tarjeta/OXXO/MSI) como invitado, recibir confirmación, y seguir su pedido por magic link. El hero funciona con scroll y respeta `prefers-reduced-motion`. Lighthouse ≥ 90 en performance/SEO/accesibilidad en páginas de contenido.

**Etiquetas (labels):** `area:frontend` `area:3d` `area:backend` `area:db` `area:payments` `area:automation` `area:content` `area:seo` `area:qa` · `size:S/M/L` · `prio:P0/P1/P2`

**Milestones:** M1 Fundación · M2 Hero 3D · M3 Explorar · M4 Producto · M5 Checkout · M6 Backend/Automatización · M7 Contenido/SEO/Perf · M8 QA/Lanzamiento

---

## M1 · Fundación y Design System

### [M1-1] Setup del proyecto (React + Vite + Tailwind)  `area:frontend` `P0` `S`
- Sub: [ ] Init Vite + React + Tailwind · [ ] estructura de carpetas/routing · [ ] ESLint/Prettier · [ ] deploy preview (Vercel/Netlify).
- Aceptación: repo corre en local y en preview; ruta `/` vacía renderiza.

### [M1-2] Design tokens y tipografía  `area:frontend` `P0` `S`
- Sub: [ ] variables CSS claro+oscuro (de "Colores de la Marca") · [ ] Fraunces/Courier Prime/Inter desde Google Fonts · [ ] modo claro/oscuro (respeta sistema) · [ ] escala tipográfica.
- Aceptación: tokens usables por Tailwind; toggle claro/oscuro sin blanco/negro puro.
- Depende: M1-1.

### [M1-3] Componentes base + cursor + transición de página  `area:frontend` `P1` `M`
- Sub: [ ] nav minimal · [ ] botones/links (hover invierte) · [ ] cursor custom pill · [ ] transición de página (sello estampándose) · [ ] `prefers-reduced-motion` global.
- Aceptación: componentes en un storybook/página demo; reduced-motion desactiva coreografías.

---

## M2 · Hero 3D (scroll cinematográfico)

### [M2-1] Escena R3F base + carga de modelo GLB  `area:3d` `P0` `M`
- Sub: [ ] R3F + drei + luces estudio · [ ] loader GLB Draco (placeholder city + marco nogal) · [ ] materiales (blanco mate, nogal) · [ ] fallback estático.
- Aceptación: el modelo carga y se ve con luz correcta; placeholder hasta el GLB real.

### [M2-2] Timeline de scroll (pinned) con GSAP + Lenis  `area:3d` `P0` `L`
- Sub: [ ] Lenis smooth scroll · [ ] ScrollTrigger pinned + scrub · [ ] mapear 0→100% a las 8 etapas del storyboard · [ ] límite de rotación (nunca reverso) · [ ] entrega a la galería (unpin).
- Aceptación: las 8 etapas ocurren con el scroll; sin mostrar el reverso; reduced-motion = versión por pasos.
- Depende: M2-1.

### [M2-3] Etapas de transformación (aéreo→blanco, marco entra, luz)  `area:3d` `P1` `L`
- Sub: [ ] cuadro de selección (etapa 2) · [ ] borrado de fondo + textos (etapa 3) · [ ] material aéreo→blanco + subida de luz (etapa 4) · [ ] marco nogal entra desde 4 lados (etapa 5) · [ ] giro lateral y regreso (6–7).
- Aceptación: coincide con el storyboard; performante (transform/opacity, sin jank).
- Depende: M2-2.

---

## M3 · Explorar (galería, colecciones, buscador)

### [M3-1] Galería infinita  `area:frontend` `P0` `M`
- Sub: [ ] grid/scatter sobre hueso, hairlines, sin sombras · [ ] carga progresiva · [ ] hover zoom + cursor "Ver destino" · [ ] arrastra-para-rotar (mini 3D) · [ ] controles a los bordes.
- Aceptación: scroll continuo fluido; drag-rotate funciona; lee `GET /api/places`.

### [M3-2] Buscador "Encuentra tu lugar" + índice A–Z  `area:frontend` `P1` `S`
- Sub: [ ] input + filtrado en vivo · [ ] índice A–Z · [ ] filtros (colección/tamaño/marco/orientación).
- Aceptación: filtra sin recarga; atajo "/" abre búsqueda.

### [M3-3] Comprar por colección + entrada a colección  `area:frontend` `P1` `M`
- Sub: [ ] bloque media pantalla con cards de colección · [ ] transición shared-element a `/coleccion/:slug` · [ ] reseñas al fondo (Disclosure).
- Aceptación: clic en colección abre su vista; reseñas revelan comentario al clic.
- Depende: M3-1.

---

## M4 · Producto y personalización

### [M4-1] Página de producto (zine + specs estilo Shupatto)  `area:frontend` `P0` `L`
- Sub: [ ] layout imagen grande + metadata · [ ] galería con warp sutil al revelar · [ ] título Fraunces / precio y specs en Courier Prime · [ ] tabla de especificaciones minimal · [ ] "Cómo llega en 3 pasos" · [ ] acordeón de detalles.
- Aceptación: lee `GET /api/places/:slug`; coordenadas reales o ninguna.

### [M4-2] Personalización + precio en vivo  `area:frontend` `P0` `M`
- Sub: [ ] selectores tamaño/color/marco/orientación/placa/capelo · [ ] preview en vivo (tiñe modelo/imagen) · [ ] cálculo de precio (reglas) · [ ] bundle opcional.
- Aceptación: el precio cambia correcto; Mediano marcado "el más elegido".
- Depende: M4-1.

### [M4-3] Estados: preventa y agotado  `area:frontend` `P1` `S`
- Sub: [ ] Spinning Text "pre-order" · [ ] Dialog de waitlist → `POST /api/waitlist`.
- Aceptación: agotado abre waitlist y guarda email.

### [M4-4] Ubicación personalizada `/personaliza`  `area:frontend` `P2` `S`
- Sub: [ ] formulario de lugar a medida · [ ] envío/cotización.
- Aceptación: crea solicitud (email/registro).

---

## M5 · Carrito y checkout

### [M5-1] Carrito (drawer boarding pass)  `area:frontend` `P0` `M`
- Sub: [ ] estado de carrito · [ ] drawer con estilo boarding pass · [ ] opción "es un regalo" · [ ] recálculo de totales · [ ] umbral envío incluido > $2,500.
- Aceptación: agregar/quitar/editar ítems; totales correctos.

### [M5-2] Checkout con Stripe  `area:payments` `P0` `M`
- Sub: [ ] `POST /api/checkout` (recalcula precios en server) · [ ] Stripe Checkout Session (card/OXXO/MSI, envío por zona) · [ ] success/cancel · [ ] metadata de ítems.
- Aceptación: redirige a Stripe y completa un pago de prueba (test mode).
- Depende: M5-1, M6-2.

---

## M6 · Backend, DB y automatización

### [M6-1] Esquema PostgreSQL + seed  `area:db` `P0` `M`
- Sub: [ ] migraciones (tablas de `database.md`) · [ ] seed de collections/places/catálogos · [ ] storage de GLB/imágenes.
- Aceptación: DB creada; datos de ejemplo consultables.

### [M6-2] API de catálogo + pricing + checkout  `area:backend` `P0` `L`
- Sub: [ ] `GET /api/collections` `GET /api/places` `GET /api/places/:slug` · [ ] `POST /api/pricing` · [ ] `POST /api/checkout` · [ ] `GET /api/orders/:token`.
- Aceptación: endpoints responden con contratos de `api.md`; precios recalculados en server.
- Depende: M6-1.

### [M6-3] Webhook Stripe + creación de orden  `area:backend` `P0` `M`
- Sub: [ ] verificación de firma · [ ] idempotencia por `stripe_session_id` · [ ] crear `order` + `order_items` + `status_token` · [ ] disparar n8n.
- Aceptación: un pago de prueba crea la orden una sola vez y dispara n8n.
- Depende: M6-2, M5-2.

### [M6-4] Flujos n8n (CFDI, guía, correos)  `area:automation` `P1` `L`
- Sub: [ ] order-paid → CFDI (PAC) · [ ] guía (Envia/Skydropx) + `tracking` · [ ] correos (Resend): confirmación/producción/enviado · [ ] checkout-abandonado · [ ] review-incentive (reemplaza review-request/#35) · [ ] avisos por Telegram.
- Aceptación: al recibir order-paid se emite CFDI (sandbox), se genera guía y sale el correo.
- Depende: M6-3.

### [M6-5] Reseñas y waitlist (API + moderación)  `area:backend` `P2` `M`
- Sub: [ ] `GET/POST /api/reviews` (subida de foto, `approved=false`) · [ ] `POST /api/waitlist` · [ ] admin approve.
- Aceptación: reseñas solo aprobadas se muestran; waitlist notifica al reactivar.

---

## M7 · Contenido, SEO y rendimiento

### [M7-1] Copy real (español) por página  `area:content` `P1` `M`
- Sub: [ ] manifiesto/about · [ ] historias de lugares (piloto 8–12) · [ ] FAQ/envíos/garantía · [ ] microcopy (sin frases cursis).
- Aceptación: cero placeholders cursis; coordenadas reales o ninguna.

### [M7-2] SEO técnico + páginas por lugar  `area:seo` `P1` `M`
- Sub: [ ] SSG/prerender de páginas de lugar · [ ] meta + datos estructurados · [ ] sitemap · [ ] alt text.
- Aceptación: cada lugar tiene URL indexable con metadatos.

### [M7-3] Rendimiento 3D y media  `area:frontend` `P1` `M`
- Sub: [ ] Draco + code-split del hero · [ ] lazy-load · [ ] imágenes AVIF/WebP + blur-up · [ ] presupuesto de performance.
- Aceptación: Lighthouse ≥ 90 en páginas de contenido; hero no bloquea carga.

---

## M8 · QA y lanzamiento

### [M8-1] QA de flujo de compra (test mode)  `area:qa` `P0` `M`
- Sub: [ ] compra de punta a punta (card/OXXO/MSI) · [ ] orden creada + correos + estado · [ ] regalo · [ ] móvil.
- Aceptación: checklist de compra pasa en desktop y móvil.

### [M8-2] Accesibilidad y reduced-motion  `area:qa` `P1` `S`
- Sub: [ ] contraste AA · [ ] teclado/focus · [ ] `prefers-reduced-motion` en hero/animaciones.
- Aceptación: auditoría a11y sin bloqueadores.

### [M8-3] Go-live  `area:qa` `P0` `S`
- Sub: [ ] dominio + SSL · [ ] Stripe a modo live · [ ] validar nombre/logo (IMPI) hecho · [ ] monitoreo/errores.
- Aceptación: sitio en producción, primer pedido real posible.

---

## Cómo crear esto en GitHub
1. Crea el **Epic** (issue madre con esta descripción o un Project).
2. Crea un **Issue por [Mx-N]** (título + cuerpo con Scope/Aceptación/Depende).
3. Los `[ ]` de "Sub" se vuelven **sub-issues** o task-list dentro del issue.
4. Asigna **milestones** (M1–M8) y **labels**. Ordena por `P0 → P2`.
5. Alimenta este archivo a Claude Code para que los genere automáticamente.
