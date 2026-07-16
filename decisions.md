---
doc: decisions.md
proyecto: Relieve — sitio web
uso: decisiones cerradas que resuelven las preguntas abiertas de la spec. Claude Code debe respetarlas.
---

# Decisiones cerradas (v1)

## 1. Base de datos → **Supabase (PostgreSQL gestionado + Storage)**
- **Por qué:** rápido de shipear, incluye **Storage** para los GLB e imágenes, cliente JS/REST instantáneo, RLS, y se integra bien con el front (React/Vite) y con Sticklight. **n8n** se conecta a la misma DB para las operaciones.
- **Nota:** tu PostgreSQL de Arenash OS (Docker) queda para lo interno; no se mezcla con la tienda.
- **Implicación:** `DATABASE_URL` de Supabase; buckets de Storage: `models` (GLB), `images` (aéreas, fotos, reseñas).

## 2. Hosting del front → **Vercel** (build en Sticklight → export → deploy)
- **Por qué:** dominio propio, SSG/SEO, variables de entorno, y **serverless functions** para `/api/*` y el **webhook de Stripe**.
- **Implicación:** las rutas `/api/...` de `api.md` viven como **funciones serverless en Vercel** (no un servidor aparte). Sticklight se usa para construir; el código se despliega en Vercel.

## 3. PAC para CFDI → **Facturama**
- **Por qué:** API amigable, buena documentación, sandbox, apto para bajo volumen.
- **Implicación:** n8n llama la API de Facturama en el flujo `order-paid` para emitir el CFDI.

## 4. Convención de precios → **enteros en CENTAVOS MXN**
- **Por qué:** Stripe cobra en la unidad mínima (centavos) y los enteros evitan errores de flotantes.
- **Implicación:** todos los precios son **enteros en centavos** (`price_cents`). Mostrar dividiendo entre 100. **Actualizar** `database.md` y `api.md` para nombrar los campos de precio en centavos (p. ej. `base_price` → interpretarse como centavos, o renombrar a `base_price_cents`).

---

## Orden de construcción (dependencia, no por documento)
Como indica el prompt de Claude Code (Fase 4): **primero esquema y migraciones (Supabase), luego servicios y API (funciones Vercel), luego UI.** El `backlog.md` está por área; Claude Code debe re-secuenciar por dependencia y marcar `blocked-by:` / `ready`.

## Pendientes que NO bloquean el arranque
- Modelo 3D real (GLB): lo produce Ale; hasta entonces, placeholder en el hero.
- Copy real por lugar: piloto de 8–12 lugares.
- Validación de nombre/logo en IMPI antes de imprimir empaque (no bloquea la web).
