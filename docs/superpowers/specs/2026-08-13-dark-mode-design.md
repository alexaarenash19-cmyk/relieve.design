# Dark mode — design spec

**Fecha:** 2026-08-13
**Disparador:** `AnimatedThemeToggler` (referencia de Aceternity/MagicUI) que el usuario mandó para portar. El sitio no tiene modo oscuro hoy — ni `dark:` de Tailwind, ni `@custom-variant dark`, ni `lucide-react` — confirmado por grep antes de empezar. `FluidMenu.jsx` ya lo documenta explícitamente en su propio comentario: "no hay tema dual confirmado en el repo".
**Autoridad de marca:** confirmada con el usuario en esta sesión — decisión propia, no requiere pasar por Ale antes de avanzar el diseño (a diferencia de la mayoría de decisiones de color del proyecto, que sí pasaron por su confirmación directa).
**Alcance:** todo el sitio, no solo secciones específicas.

## Arquitectura

**Decisión central: sobrescribir las variables CSS de los tokens bajo una clase `.dark`, no parchar cada componente con `dark:`.**

El sitio no usa `dark:` en ningún componente — usa clases de color literales (`bg-gallery-white`, `text-graphite`, etc.) en ~30 archivos, todas resolviendo a `var(--color-*)` porque Tailwind v4 compila los tokens de `@theme` así. Redefinir esas mismas variables dentro de un bloque `.dark { --color-x: ...; }` hace que **todo el sitio se adapte automáticamente**, sin tocar los ~30 archivos de componentes uno por uno. La alternativa (agregar `dark:bg-X dark:text-Y` a mano en cada componente) es mucho más trabajo y mucho más fácil de dejar algo sin cubrir.

Mecanismo: `@custom-variant dark (&:where(.dark, .dark *));` en `src/index.css` (convención Tailwind v4 CSS-first, ya que este repo no tiene `tailwind.config.js`), clase `.dark` puesta en `<html>`.

**Límite conocido de este enfoque:** cualquier color escrito como literal (`rgba(...)`, hex directo en una regla CSS) en vez de `var(--color-x)` **no** se adapta solo — necesita su propio override `.dark .clase-x { ... }` a mano. Lista completa de esos casos más abajo.

## Paleta — los 15 tokens reales de `src/index.css`

(No son "10" exactos — el bloque `@theme` tiene 10 del brand audit original más 5 agregados en pasadas posteriores: `--color-line`, `--color-brand-dark`, `--color-piedra`, `--color-grafito`, `--color-cempasuchil`.)

| Token | Claro (hoy) | Oscuro (propuesto) | Nota |
|---|---|---|---|
| `--color-gallery-white` | `#f6f3ed` | `#1f1e1a` | Flip completo — ver "Tensión gallery-white" abajo, es la única decisión no trivial de la tabla |
| `--color-graphite` | `#232323` | `#e8e3d9` | El "ink" por defecto se invierte — cubre automáticamente todo `bg-graphite`/`text-graphite` del sitio |
| `--color-explorer-blue` | `#b9ccd8` | `#c7d8e2` | Mismo tono, aclarado ligeramente |
| `--color-sage` | `#aeb99e` | `#b9c4a8` | Ídem |
| `--color-walnut` | `#7a5a43` | `#a67c5c` | Los cafés medios se ven sucios sobre casi-negro; se aclara |
| `--color-stone` | `#c8c3bc` | `#a9a49d` | Atenuado para no deslumbrar junto al resto oscuro |
| `--color-passport-ink` | `#355a75` | `#5b83a0` | Aclarado para legibilidad sobre fondo oscuro |
| `--color-sello-navy` | `#22405c` | `#3d6183` | Ídem |
| `--color-dark-bg` | `#1a1b19` | *(sin cambio — ya es la base)* | Existía sin usar; ancla del fondo en modo oscuro |
| `--color-dark-fg` | `#ece7dd` | *(sin cambio — ya es la base)* | Existía sin usar; ancla del texto en modo oscuro |
| `--color-line` | `#e4ded3` | `#3a3733` | Hairline visible sobre fondo casi-negro |
| `--color-brand-dark` | `#355974` | `#5c85a3` | Mismo criterio que passport-ink/sello-navy |
| `--color-piedra` | `#e8e3d9` | *(sin cambio)* | Landing-scoped únicamente; ya es casi idéntico a dark-fg, no necesita su propio ajuste |
| `--color-grafito` | `#1e1c19` | *(sin cambio)* | Landing-scoped únicamente; ya es casi idéntico a dark-bg |
| `--color-cempasuchil` | `#e86a1c` | *(sin cambio)* | Sin uso vivo en el sitio hoy (revertido en PR #168); un naranja saturado funciona igual en ambos modos |

**Paso obligatorio antes de dar esta tabla por buena:** correr cada par texto/fondo real (no solo los que cambiaron) por un chequeo de contraste AA (4.5:1 texto normal, 3:1 texto grande) — DevTools o axe. "Se ve bien" no es suficiente, tiene que medirse. Si algún valor de la tabla no pasa, se ajusta antes de mergear, no después.

### Tensión `gallery-white` — la única decisión no trivial

`gallery-white` se usa hoy en dos roles distintos con el mismo token:
1. **Superficie/fondo** de paneles y tarjetas (`bg-gallery-white` en `CartDrawer.jsx`, el panel de detalles de `Product.jsx`, etc.) — esto necesita oscurecerse en modo oscuro, o esos paneles se quedan brillantes en medio de un sitio oscuro.
2. **Texto claro sobre fondo de acento oscuro** — específicamente `Product.jsx`'s `ACCENT_CLASSES` (walnut/passport-ink/sello-navy tienen `dark: true` → `text-gallery-white`). Este uso necesita quedarse claro.

Como es el mismo token, no puede resolver los dos roles a la vez con un solo valor. Se resuelve así: **`gallery-white` sí se invierte** (para que los paneles/superficies — el caso más común, ~30 archivos — funcionen sin tocarlos), y los 3 pares de `ACCENT_CLASSES` en `Product.jsx` que dependen del rol 2 se marcan como **follow-up puntual**: en modo oscuro sus fondos (walnut/passport-ink/sello-navy) también se aclaran por la tabla de arriba, así que "texto claro sobre fondo ahora más claro" puede perder contraste — se revisa a mano en el preview y, si hace falta, ese archivo específico gana su propio ajuste `.dark` (no un cambio de arquitectura, solo 3 pares a verificar).

## Overrides manuales necesarios (colores literales, no tokens)

Estos NO se resuelven solos con el override de `.dark` porque no usan `var(--color-x)`:

- `.pill-glass` / `.pill-glass-active` (rgba de gallery-white/brand-dark/graphite, hardcoded)
- `.glass-card` (mismo patrón, agregado en PR #196)
- `:focus-visible` box-shadow — usa `var(--color-gallery-white)` como color del "hueco" interior del anillo; si gallery-white se invierte (ver arriba) esto se resuelve solo, pero verificar visualmente igual
- `body::before` (grano de papel, `mix-blend-mode: multiply`) — multiply sobre casi-negro puede volver el grano casi invisible; considerar `screen` en `.dark`
- El overlay de `LoadingReveal.jsx` (PR #197) — usa `bg-piedra` (token, se resuelve solo) pero si Ale pide ajustar la mezcla de la foto/wordmark en oscuro, es manual

## Componente: toggle

- Puerto de `AnimatedThemeToggler`, recortado a **una sola forma de transición: círculo** (las otras 6 — cuadrado/triángulo/diamante/hexágono/rectángulo/estrella — no se portan, YAGNI confirmado con el usuario).
- Sin `lucide-react` (no está instalado, mismo criterio que `FluidMenu.jsx`) — iconos Sol/Luna inline `stroke="currentColor"`, mismo estilo que los íconos de `FluidMenu.jsx`.
- Transición: `document.startViewTransition` nativo (sin librería) — fallback a swap instantáneo si el navegador no lo soporta (Firefox hoy), tal como ya lo maneja el componente de referencia.
- Ubicación: círculo fijo abajo-izquierda, tokens de marca — confirmado que no choca con el único otro elemento `fixed bottom-*` del sitio (`Gallery.jsx`'s barra de control, `bottom-5 inset-x-0 justify-center`, centrada, solo en `/colecciones`).
- **Modo controlado, no el estado interno del componente**: se le pasan `theme`/`onThemeChange` como props — la persistencia la maneja un `ThemeContext.jsx` nuevo (mismo patrón que `CartContext.jsx`: contexto + `localStorage`), con clave `relieve_theme` (sigue la convención `relieve_*` ya usada por `relieve_cart`/`relieve_loading_seen`). Si se deja el componente en su modo no controlado por default, escribe en `localStorage.theme` — la clave equivocada — así que esto hay que cablearlo explícito, no es el default.

## Tema inicial y anti-parpadeo (FOUC)

Dos requisitos, confirmados en esta sesión:
1. **Respeta `prefers-color-scheme` en la primera visita** (sin nada guardado todavía); una vez que alguien togglea manualmente, `localStorage.relieve_theme` manda sobre el sistema en visitas futuras.
2. **Sin parpadeo claro→oscuro.** Como React monta después del primer paint, decidir el tema en un `useEffect` deja ver un frame (o más) del tema equivocado en cada carga para quien ya tiene oscuro guardado. Se resuelve con un script inline, bloqueante, en el `<head>` de `index.html` — antes de cualquier hoja de estilo/bundle — que lee `localStorage.relieve_theme` (o `prefers-color-scheme` si no hay nada guardado) y pone la clase `.dark` en `<html>` de inmediato:

```html
<script>
(function () {
  try {
    var stored = localStorage.getItem('relieve_theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
</script>
```

Va justo después de `<meta charset>` en `index.html`, antes de cualquier otro `<link>`/`<script>`.

## Verificación (Vercel preview + Claude-in-Chrome)

Togglear en, como mínimo:
- Home (hero + canvas + Curva de Nivel)
- Página de producto (incluye el quick-buy de PR #196 y sus 3 pares de acento aclarado)
- Colecciones
- El navbar (una vez que se resuelva el efecto pendiente de shrink-on-scroll)
- El toggle mismo en sus dos estados (verificar que el ícono/posición se vean bien en ambos)
- El intro/loading screen (PR #197) — usa `bg-piedra` (token) pero conviene confirmarlo a mano, no solo asumir que el token override basta
- El dialog de checkout (PR #196) y el drawer de carrito (`bg-gallery-white` → ahora invertido, revisar que siga siendo el mismo "panel neutral" que hoy)

## Fuera de alcance (YAGNI, confirmado)

- Las 6 formas de transición no-círculo del componente de referencia.
- Ajustar `piedra`/`grafito` (landing-scoped) — ya casi coinciden con dark-bg/dark-fg, no se tocan en esta pasada.
- Rediseñar `ACCENT_CLASSES` de `Product.jsx` como sistema — solo se parcha si el chequeo de contraste lo pide.
