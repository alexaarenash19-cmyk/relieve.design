---
doc: decisions.md (v3 — consolidado)
proyecto: Relieve — sitio web
uso: decisiones cerradas que resuelven las preguntas abiertas de la spec. Claude Code debe respetarlas — este archivo es AUTORITATIVO y gana sobre cualquier otro doc si hay contradicción.
reemplaza a: decisions.md v1 (13 jul) + addendum v2 (16 jul) — este es el único que se copia al repo como `decisions.md`.
---

# Decisiones cerradas (v3 — consolidado)

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

## 5. Regla de automatización del pipeline de impresión → aplica desde ya, umbral >5x/semana
- **Contexto:** Audit 9 había recomendado *"no automatices nada hasta haber fabricado 30-50 piezas"*. El Relieve Operating System define una regla general: *"todo proceso repetitivo deberá automatizarse cuando ocurra más de cinco veces por semana."*
- **Decisión (confirmada 16 jul):** la regla de >5x/semana **sí aplica a la impresión de los mapas** y gobierna por encima de la recomendación de Audit 9 de esperar a 30-50 piezas.
- **Implicación técnica:** sin cambios al backlog por ahora — M6-4 (flujos n8n) sigue como está. Cuando el volumen se acerque a 5 impresiones/semana, retomar qué se automatiza primero.

## 6. Fotografía de catálogo → renders ahora (Fase 0), fotografía real conforme estén los marcos (Fase 1)
- **Decisión (confirmada 16 jul):** el catálogo lanza con **renders** (tratamiento de Doc 6: acabado mate, fondo neutro, una fuente de luz, sombra suave) como imagen provisional — no espera fotografía real. Distinto del modelo GLB interactivo del hero (ese ya era render/3D por diseño).
- **Fase 1 (~1 semana, cuando el marco esté listo):** Ángel de la Independencia y Gran Vía se fotografían con luz natural y sustituyen su render — pieza por pieza, no hay que esperar el catálogo completo.
- **Implicación técnica (nuevo):** `places.aerial_url`, `thumb_url` y `model_url` deben poder estar **NULL o apuntar a un placeholder** desde el primer commit — el frontend debe manejar el caso "sin imagen todavía" sin romperse (fallback visual, no error). Esto ya era el criterio para `model_url` en v1; se extiende explícitamente a `thumb_url`/`aerial_url`.

---

# Orden de construcción (dependencia, no por documento)
Como indica `claude-code-backlog-prompt.md`: **primero esquema y migraciones (Supabase), luego servicios y API (funciones Vercel), luego UI** (el hero 3D al final de la UI, detrás de un placeholder). El `backlog.md` está por área; Claude Code debe re-secuenciar por dependencia y marcar `blocked-by:` / `ready`.

# Pendientes que NO bloquean el arranque
- **Modelo 3D real (GLB):** lo produce Ale; hasta entonces, placeholder en el hero.
- **Imagen de catálogo (render o foto):** ver decisión 6 — placeholder/NULL manejado por el frontend desde el día uno.
- **Copy real por lugar:** piloto de 8–12 lugares.
- **Validación de nombre/logo en IMPI** antes de imprimir empaque (no bloquea la web).

# Gaps detectados — no bloquean Fase 1 del prompt, pero decide antes de que Claude Code llegue a esa parte
1. **Observabilidad:** Audit 9 (riesgo #6) preguntó "¿quién se entera si Stripe/Supabase/Cloudinary fallan?" y nunca se resolvió. `architecture.md` no especifica logging/alertas/error tracking. Sin esto, un fallo en el webhook de Stripe puede pasar inadvertido y perder pedidos.
2. **Páginas legales:** no hay ruta para aviso de privacidad / términos y condiciones — necesario para procesar pagos y datos personales en México (LFPDPPP). No está en las 9 rutas de `ui-ux.md`.
3. **Flujo de administración diaria:** `api.md` tiene endpoints admin (aprobar reseñas, actualizar pedidos) pero no hay decisión de si Ale los opera desde una UI simple o directo en el dashboard de Supabase. Afecta si M6-5 necesita una pantalla o no.
