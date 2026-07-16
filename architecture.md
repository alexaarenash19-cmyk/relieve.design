---
doc: architecture.md
proyecto: Relieve — sitio web
version: 0.1
---

# Arquitectura

## Objetivo
Tienda de piezas de diseño (mapas en relieve 3D enmarcados en madera) con un **hero cinematográfico 3D ligado al scroll** y un checkout premium. Made-to-order (sin stock físico). Mercado: México. Todo el copy en español.

## Stack
- **Frontend:** React 18 + Vite + Tailwind (construido en Sticklight). SPA con rutas.
- **3D / motion del hero:** Three.js r128 + React-Three-Fiber + drei + **GSAP ScrollTrigger** + **Lenis** (scroll suave). Modelos en **GLB** con compresión **Draco**.
- **Pagos:** **Stripe Checkout** (tarjeta, OXXO, MSI). Guest checkout (sin cuenta).
- **Base de datos:** **PostgreSQL** (tu stack). Alternativa gestionada: Supabase (Postgres + storage + auth admin) si no quieres hospedar la DB.
- **Automatización / backend de operaciones:** **n8n** (Docker) orquestando: facturación **CFDI** (PAC: Facturama/SW/Bind), **guías de envío** (Envia.com/Skydropx), y **correos** (Resend/Postmark).
- **Almacenamiento de media:** GLB, imágenes aéreas y fotos en un bucket/CDN (Supabase Storage, S3 o Cloudinary). Imágenes en AVIF/WebP.
- **Hosting:** frontend en Vercel/Netlify; n8n self-hosted (Docker); DB en Supabase o tu servidor.

## Flujo de datos (alto nivel)
1. **Explorar:** el front lee `places` y `collections` (API o, en el lanzamiento, un JSON estático generado desde la DB). Buscador con índice A–Z.
2. **Pieza:** carga detalle del lugar (coordenadas reales, historia, `model_url` GLB) y opciones de personalización.
3. **Personalizar:** el precio se calcula en cliente con una **tabla de reglas** (tamaño + marco + color + add-ons); ver `database.md`.
4. **Checkout:** el front llama `POST /api/checkout` → crea **Stripe Checkout Session** → redirige a Stripe.
5. **Pago confirmado:** **webhook de Stripe** (`checkout.session.completed`) → crea `order` (estado `paid`), guarda ítems y metadata, y dispara **n8n**.
6. **n8n:** genera **CFDI**, crea **guía de envío**, envía **correos** (confirmación, en producción, enviado, reseña). Actualiza `order.status`.
7. **Seguimiento:** el cliente ve el estado en `/pedido/:token` (**magic link** por correo, sin cuenta).

## Diagrama (texto)
```
[React/Vite front] --reads--> [API / static JSON] --> [PostgreSQL]
        |                                   ^
        | POST /api/checkout                | order writes
        v                                   |
     [Stripe Checkout] --webhook--> [/api/webhooks/stripe] --> [n8n]
                                                   |--> CFDI (PAC)
                                                   |--> Guía (Envia/Skydropx)
                                                   |--> Emails (Resend)
                                                   '--> update order.status
[Media CDN: GLB(Draco), imágenes AVIF/WebP]
```

## Renderizado y SEO
- Páginas de contenido y de lugar **pre-renderizadas** (SSG) para SEO (una URL indexable por lugar). El hero 3D se hidrata en cliente.
- Metadatos por lugar (título, descripción, coordenadas), datos estructurados de producto.

## Rendimiento
- GLB con Draco (~2–5MB), lazy-load del hero, code-splitting del bundle 3D.
- Respetar `prefers-reduced-motion` (hero cae a versión estática por pasos).
- Imágenes responsivas (`<picture>` AVIF/WebP), blur-up (LQIP).

## Entornos y seguridad
- `.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, `N8N_WEBHOOK_URL`, claves de PAC/paquetería/email. **Nada de secretos en el front.**
- Stripe hospeda el checkout (menos carga PCI). Webhooks **firmados** (verificar firma).
- Admin (moderar reseñas, actualizar pedidos) detrás de token/simple auth.

## Fases
- **F1 (lanzamiento):** catálogo pequeño (JSON estático o DB), hero 3D con placeholder→modelo real, Stripe Checkout, n8n para CFDI/envíos/correos.
- **F2:** buscador/índice completo desde DB, reseñas con foto, waitlist.
- **F3:** panel admin, internacional, más colecciones.
