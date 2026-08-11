---
doc: architecture.md
proyecto: Relieve — sitio web
version: 0.2
corrección: 10 ago 2026 (auditoría, sesión 5) — Stack/Entornos/Fases tenían
  datos obsoletos frente al código real (React 18→19, Three r128, Supabase
  como "alternativa", Vercel/Netlify, admin panel como fase futura). Ver
  detalle en cada sección.
---

# Arquitectura

## Objetivo
Tienda de piezas de diseño (mapas en relieve 3D enmarcados en madera) con un **hero cinematográfico 3D ligado al scroll** y un checkout premium. Made-to-order (sin stock físico). Mercado: México. Todo el copy en español.

## Stack
- **Frontend:** React 19 + Vite + Tailwind v4. SPA con rutas (`react-router-dom`), code-splitting por ruta y por librería pesada (`lazy()` en `src/App.jsx`).
- **3D / motion del hero:** Three.js + React-Three-Fiber + drei + **GSAP** (ScrollTrigger + timelines) + **Lenis** (scroll suave). Versiones exactas en `package.json` — deliberadamente no se fijan aquí, para no repetir el mismo desfase que tenía esta sección (decía "React 18"/"Three.js r128", ambos ya superados en el código real).
- **Pagos:** **Stripe Checkout** (tarjeta, OXXO, MSI). Guest checkout (sin cuenta).
- **Base de datos:** **Supabase** (Postgres gestionado + Storage) — decisión cerrada, ver `decisions.md` §1. No es una alternativa "si no quieres hospedar la DB": ya es el único backend de datos del sitio (`lib/supabase.js`, `supabase/migrations/`).
- **Automatización / backend de operaciones:** **n8n** — workflows versionados en `n8n/workflows/` (`checkout-abandonado`, `order-paid-confirmation`, `order-shipped`, `review-incentive`), pero **solo uno está conectado a una instancia de n8n en vivo hoy**: `api/webhooks/stripe.js` llama `N8N_WEBHOOK_URL` (si está configurado) para disparar `order-paid` (CFDI/guía). Las notificaciones al cliente (confirmación de compra, aviso de envío) **no** pasan por n8n — se envían directo desde `lib/alerts.js` vía Resend, con el mismo copy que sus workflows homónimos, porque esos workflows nunca contestaron contra una instancia real (hallazgo de la auditoría 10 ago 2026). `checkout-abandonado`/`review-incentive` tampoco están conectados a nada todavía.
- **Almacenamiento de media:** URLs de imagen/GLB en columnas de `places` (`thumb_url`, `aerial_url`, `model_url`); pueden ser `NULL`/placeholder por diseño (`decisions.md` §6).
- **Hosting:** **Vercel únicamente** (frontend + funciones serverless en `api/*`) — decisión cerrada, ver `decisions.md` §2. No hay Netlify.

## Flujo de datos (alto nivel)
1. **Explorar:** el front lee `places`/`collections` vía `/api/catalog`. Buscador con índice A–Z (`/buscar`).
2. **Pieza:** `/pieza/:slug` carga detalle del lugar y opciones de personalización.
3. **Personalizar:** precio calculado en cliente (tabla de reglas tamaño+marco+color+add-ons); ver `database.md`.
4. **Checkout:** `POST /api/checkout` valida el `status` del place (solo `active`/`preorder` son comprables) y límites de texto libre en los campos abiertos, crea **Stripe Checkout Session**, redirige a Stripe.
5. **Pago confirmado:** `api/webhooks/stripe.js` (`checkout.session.completed`, firma verificada) crea `order` + `order_items` (falla ruidosamente y alerta si el insert de items falla), marca el `cart` correspondiente como completado, envía las 2 notificaciones (interna + cliente) y dispara `N8N_WEBHOOK_URL` si existe. Duplicados por reintento/entrega concurrente de Stripe se resuelven vía `unique` en `orders.stripe_session_id` + tratar el error `23505` como "ya lo insertó otra entrega", no como fallo.
6. **Operación diaria:** Ale marca envíos desde `/admin/envios` (protegido por `ADMIN_TOKEN`), lo que dispara el correo de rastreo directo desde `lib/alerts.js`.
7. **Seguimiento:** el cliente ve el estado en `/pedido/:token` (**magic link** por correo, sin cuenta); `/pedido/success` resuelve el retorno inmediato de Stripe por `session_id` (debe montarse antes que la ruta de token en el router).

## Diagrama (texto)
```
[React/Vite front] --lee--> [/api/catalog] --> [Supabase/Postgres]
        |                                   ^
        | POST /api/checkout                | inserts de orders/order_items
        v                                   |
     [Stripe Checkout] --webhook firmado--> [/api/webhooks/stripe] --Resend--> [cliente + Ale]
                                                   '--(si N8N_WEBHOOK_URL)--> [n8n: order-paid]
[/admin/envios] --PATCH /api/admin/orders/:id--> [Supabase] --Resend--> [correo de rastreo]
```

## Renderizado y SEO
- `scripts/prerender.mjs` corre después del build (`npm run build`) — inserta metadatos en `dist/index.html`; no ejecuta React.
- El hero 3D se hidrata en cliente; el resto de rutas son SPA normal, cargadas bajo demanda (`lazy()`).

## Rendimiento
- Code-splitting por ruta y por librería pesada: `LoadingReveal`/`ProductPanel` (gsap) van en su propio `lazy()` aparte de su ruta, precisamente para que páginas que nunca tocan gsap (ej. `/faq`) no lo carguen en su bundle inicial.
- Respetar `prefers-reduced-motion` (ver `.canvas-tile`, `.flap-row`, `.page-stamp`, etc. en `src/index.css`, y `RollingPrice`).

## Entornos y seguridad
- Variables reales confirmadas en el código (no una lista aspiracional): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_TOKEN`, `RESEND_API_KEY`, `ALERT_EMAIL`, `SITE_URL`, `N8N_WEBHOOK_URL` (opcional — si falta, simplemente no se dispara ese paso), `CRON_SECRET` (nuevo, sesión 5 de la auditoría — protege `/api/cron/cleanup-rate-limits`). **Nada de secretos en el front** — el front nunca recibe una key de Supabase; todo pasa por `/api/*` con `SUPABASE_SERVICE_KEY`.
- Webhooks de Stripe **firmados** (`stripe.webhooks.constructEvent` contra `STRIPE_WEBHOOK_SECRET`).
- Admin (`/admin/envios`): protegido por `ADMIN_TOKEN`, un secreto compartido comparado con `crypto.timingSafeEqual` (`lib/adminAuth.js`) — no un login real. El cliente lo guarda en `sessionStorage` tras pegarlo una vez (hallazgo #2 de la auditoría 10 ago 2026); el fix robusto — cookie httpOnly + endpoint de login dedicado — sigue pendiente, es un cambio de arquitectura aparte.
- RLS habilitado en las 12 tablas de `public` (`supabase/migrations/20260724010001_...` + `..._carts_enable_rls.sql`) como defense-in-depth — el backend usa `SUPABASE_SERVICE_KEY`, que evade RLS igual que el rol `postgres` de n8n, así que esto protege contra una eventual anon key expuesta, no un exploit activo hoy.

## Fases
- **F1 (lanzamiento):** ✅ hecho — catálogo desde Supabase, hero 3D, Stripe Checkout, correos transaccionales.
- **F2:** ✅ hecho — buscador/índice completo, reseñas con foto, waitlist.
- **F3:** panel admin básico **ya está en producción** (`/admin/envios`, agregado 8 ago 2026) — lo que queda de esta fase es login real (no token compartido), internacional y más colecciones.
