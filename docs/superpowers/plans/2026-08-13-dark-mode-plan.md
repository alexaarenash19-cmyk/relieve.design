# Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working dark mode to relieve-web, toggled by a fixed circular button (bottom-left), covering the whole site via CSS custom-property overrides under a `.dark` class, with no flash-of-wrong-theme on load.

**Architecture:** Tailwind v4 CSS-first `@custom-variant dark`, a single `.dark { --color-*: ... }` override block in `src/index.css` that every existing `bg-X`/`text-X`/`border-X` utility already resolves through (no per-component edits needed for token-driven colors), plus hand-written `.dark` overrides for the handful of literal (non-token) colors in the same file. A `ThemeContext` (same shape as the existing `CartContext`) owns the `dark`/`light` state and `localStorage` persistence; a blocking inline script in `index.html` sets the class before the app bundle loads to avoid a flash.

**Tech Stack:** Vite, React 19, React Router 7, Tailwind v4 (CSS-first, no `tailwind.config.js`), GSAP (untouched by this plan), plain Node `assert` for pure-logic tests (`node path/to/file.test.mjs`, chained in `package.json`'s `test` script — no Jest/Vitest in this repo).

## Global Constraints

- No TypeScript anywhere — this repo is 100% `.jsx`/`.js`.
- No new npm dependencies (specifically: no `lucide-react` — confirmed absent, `FluidMenu.jsx` already made this call for the same reason).
- `localStorage` key MUST be `relieve_theme` (matches the `relieve_*` convention already used by `relieve_cart`/`relieve_loading_seen`) — NOT `theme` (the reference component's own default).
- Toggle transition shape: circle only. The other 6 shapes from the reference component (square/triangle/diamond/hexagon/rectangle/star) are explicitly out of scope (YAGNI, confirmed with the user).
- Spec source of truth: `docs/superpowers/specs/2026-08-13-dark-mode-design.md` — the 15-token light→dark table in that file is authoritative; copy values from there, don't re-derive them.
- Repo has no local clone / no local test-running environment for the app itself (per project convention) — pure-logic `.test.mjs` files ARE run directly with `node`, but UI changes are verified via a Vercel preview deploy + visual check (no component-testing framework exists in this repo — don't invent one).

---

### Task 1: `src/lib/theme.js` — pure theme-preference helpers

**Files:**
- Create: `src/lib/theme.js`
- Test: `src/lib/theme.test.mjs`
- Modify: `package.json:test` script (append the new test file to the `&&`-chained list, same pattern every other `src/lib/*.test.mjs` already follows)

**Interfaces:**
- Produces: `THEME_KEY` (string constant, `'relieve_theme'`), `getStoredTheme(storage)` → `'dark' | 'light' | null`, `setStoredTheme(storage, theme)` → `void`, `getPreferredTheme(storage, matchMedia)` → `'dark' | 'light'`. All three take an injected storage-like object (`{getItem, setItem}`, matching `src/lib/loadingReveal.js`'s existing pattern) — never touch `window`/`localStorage` directly, so they're Node-testable with no DOM.

- [ ] **Step 1: Write the failing test**

Create `src/lib/theme.test.mjs`:

```js
// Run: node src/lib/theme.test.mjs
import assert from 'node:assert';
import { THEME_KEY, getStoredTheme, setStoredTheme, getPreferredTheme } from './theme.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}
function fakeMatchMedia(matches) {
  return () => ({ matches });
}

// No stored value yet.
assert.strictEqual(getStoredTheme(fakeStorage()), null);

// Only 'dark'/'light' are valid; garbage is treated as "nothing stored".
assert.strictEqual(getStoredTheme(fakeStorage({ [THEME_KEY]: 'sepia' })), null);

// A real stored value round-trips.
assert.strictEqual(getStoredTheme(fakeStorage({ [THEME_KEY]: 'dark' })), 'dark');

// setStoredTheme writes under the exact relieve_* key.
const storage = fakeStorage();
setStoredTheme(storage, 'dark');
assert.strictEqual(storage.getItem(THEME_KEY), 'dark');

// A storage that throws (disabled/private mode) never crashes — same
// tolerance as loadingReveal.js's alreadySeen/markSeen.
const throwingStorage = {
  getItem() {
    throw new Error('disabled');
  },
  setItem() {
    throw new Error('disabled');
  },
};
assert.strictEqual(getStoredTheme(throwingStorage), null);
setStoredTheme(throwingStorage, 'dark'); // must not throw

// getPreferredTheme: stored value wins over system preference.
assert.strictEqual(
  getPreferredTheme(fakeStorage({ [THEME_KEY]: 'light' }), fakeMatchMedia(true)),
  'light',
);

// No stored value — falls back to system preference.
assert.strictEqual(getPreferredTheme(fakeStorage(), fakeMatchMedia(true)), 'dark');
assert.strictEqual(getPreferredTheme(fakeStorage(), fakeMatchMedia(false)), 'light');

// matchMedia throwing (e.g. unsupported) falls back to 'light', never crashes.
const throwingMatchMedia = () => {
  throw new Error('unsupported');
};
assert.strictEqual(getPreferredTheme(fakeStorage(), throwingMatchMedia), 'light');

console.log('theme helper checks: OK');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/lib/theme.test.mjs`
Expected: FAIL — `Cannot find module './theme.js'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/lib/theme.js`:

```js
// Pure, testable helpers for dark mode (src/context/ThemeContext.jsx) —
// same split as src/lib/loadingReveal.js: storage/matchMedia are injected
// so this is unit-testable without a DOM. The blocking anti-FOUC script
// in index.html duplicates getPreferredTheme's exact logic as plain
// inline JS (it has to run before any module bundle loads, so it can't
// import this file) — keep the two in sync if this logic ever changes.
export const THEME_KEY = 'relieve_theme';

export function getStoredTheme(storage) {
  try {
    const v = storage?.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null; // storage disabled (e.g. private mode) — treated as "nothing stored"
  }
}

export function setStoredTheme(storage, theme) {
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
    // storage unavailable — not fatal, the preference just won't persist
  }
}

// stored value wins; otherwise falls back to the system preference;
// otherwise falls back to 'light'. matchMedia is injected (no default —
// callers pass window.matchMedia) so this file never references `window`
// and stays Node-testable.
export function getPreferredTheme(storage, matchMedia) {
  const stored = getStoredTheme(storage);
  if (stored) return stored;
  try {
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/lib/theme.test.mjs`
Expected: PASS — prints `theme helper checks: OK`, exit code 0.

- [ ] **Step 5: Add the test to `package.json`'s chained `test` script**

Modify `package.json` — the `scripts.test` value currently ends in `... && node scripts/prerender.test.mjs && node src/lib/pageWipe.test.mjs`. Append ` && node src/lib/theme.test.mjs` to that same string (after `pageWipe.test.mjs`, matching where other `src/lib/*.test.mjs` entries live in the chain).

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme.js src/lib/theme.test.mjs package.json
git commit -m "feat: add theme.js pure helpers for dark mode"
```

---

### Task 2: `src/index.css` — `@custom-variant dark`, token overrides, literal-color overrides

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: a `.dark` class that, applied to `<html>`, re-themes every existing `bg-*`/`text-*`/`border-*` Tailwind utility already used across the codebase (no other file needs to change for token-driven colors).

- [ ] **Step 1: Add the Tailwind v4 dark variant**

At the very top of `src/index.css`, immediately after the existing `@import "tailwindcss";` line, add:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

- [ ] **Step 2: Recolor `--color-sello-navy` in the `@theme` block (light mode)**

Confirmed by the user (13 ago, from Ale): the accent role carried by `--color-sello-navy` changes from navy to red, in **both** modes — this is a live rebrand of the current site's accent color, not a dark-mode-only value. The token's *name* stays `sello-navy` on purpose (renaming it would require touching every one of the ~6+ files already using `bg-sello-navy`/`text-sello-navy`/`border-sello-navy`, risking one getting missed and silently losing the class — see the spec's palette-table note on this row for the full reasoning).

In the existing `@theme { ... }` block in `src/index.css`, find `--color-sello-navy: #22405c;` and change it to:

```css
--color-sello-navy: #c21807; /* rebrand confirmado por Ale (13 ago 2026) — navy -> rojo, ver docs/superpowers/specs/2026-08-13-dark-mode-design.md */
```

- [ ] **Step 3: Add the `.dark` token-override block**

Immediately after the `@theme { ... }` block's closing `}` (right before the existing `body { ... }` rule), add:

```css
/* Dark mode — same 15 tokens as @theme above, redefined under .dark.
   Every existing bg-X/text-X/border-X utility in the codebase already
   compiles to `var(--color-X)`, so this one block re-themes the whole
   site with no per-component changes. Values from
   docs/superpowers/specs/2026-08-13-dark-mode-design.md's palette table
   — dark-bg/dark-fg/piedra/grafito/cempasuchil are intentionally absent
   here: they're either already the dark-mode anchor or explicitly
   unchanged per that spec. */
.dark {
  --color-gallery-white: #1f1e1a;
  --color-graphite: #e8e3d9;
  --color-explorer-blue: #c7d8e2;
  --color-sage: #b9c4a8;
  --color-walnut: #a67c5c;
  --color-stone: #a9a49d;
  --color-passport-ink: #5b83a0;
  --color-sello-navy: #ff6659;
  --color-line: #3a3733;
  --color-brand-dark: #5c85a3;
}
```

- [ ] **Step 4: Add the `.dark` overrides for literal (non-token) colors**

These don't use `var(--color-x)`, so they don't inherit from Step 3. Find the existing `.pill-glass-active:active { ... }` rule (the last of the three `.pill-glass*` rules, right before the `@media (prefers-reduced-transparency: reduce)` block), and insert this immediately after it, still before that media query:

```css
/* Dark-mode versions of the two Liquid Glass materials above — these use
   literal rgba(), not var(--color-x), so they don't inherit the .dark
   token overrides and need their own values. Same relative
   treatment (translucent, low-alpha, dark-bg-tinted) as the light
   versions, just inverted: dark-bg tint instead of gallery-white tint. */
.dark .pill-glass {
  background: rgba(26, 27, 25, 0.4);
  border: 1px solid rgba(236, 231, 221, 0.18);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 10px 24px -12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dark .pill-glass:hover {
  background: rgba(26, 27, 25, 0.55);
}
.dark .pill-glass:active {
  background: rgba(26, 27, 25, 0.7);
}
.dark .pill-glass-active {
  background: rgba(92, 133, 163, 0.55); /* dark-mode --color-brand-dark, tinted */
  border: 1px solid rgba(236, 231, 221, 0.14);
}
.dark .pill-glass-active:hover {
  background: rgba(92, 133, 163, 0.7);
}
.dark .pill-glass-active:active {
  background: rgba(92, 133, 163, 0.82);
}
@media (prefers-reduced-transparency: reduce) {
  .dark .pill-glass {
    background: rgba(26, 27, 25, 0.96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .dark .pill-glass-active {
    background: rgba(92, 133, 163, 0.96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

- [ ] **Step 5: Fix the paper-grain overlay's blend mode for dark backgrounds**

Find the existing `body::before { ... }` rule (the paper-grain noise overlay, `mix-blend-mode: multiply`). `multiply` darkens — on a near-black dark-mode background the grain would be crushed to invisible. Add immediately after that rule's closing `}`:

```css
/* multiply darkens — on the near-black dark-mode background the grain
   would be crushed to invisible. screen lightens instead, so the same
   texture stays visible; opacity trimmed slightly since screen blending
   reads stronger against a dark base than multiply does against light. */
.dark body::before {
  mix-blend-mode: screen;
  opacity: 0.04;
}
```

- [ ] **Step 6: Note — do NOT touch `:focus-visible` or `.glass-card` in this task**

`:focus-visible`'s box-shadow already references `var(--color-gallery-white)`, which Step 3 already re-themes to a dark value — no separate override needed, but confirm this visually in Task 7 (don't assume). `.glass-card` (from the still-open `feat/glass-order-summary-card` branch, PR #196) doesn't exist on `main` yet, so it isn't in this file to modify — if that PR merges before this one, add a `.dark .glass-card` override then, following the exact same pattern as `.dark .pill-glass` in Step 4.

- [ ] **Step 7: Commit**

```bash
git add src/index.css
git commit -m "feat: dark mode token overrides + literal-color overrides"
```

---

### Task 3: `index.html` — blocking anti-FOUC script

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: nothing (runs before any JS module loads).
- Produces: `<html class="dark">` already set (or absent) by the time the CSS/app paints, for a visitor who has a stored preference or a system dark-mode preference.

- [ ] **Step 1: Add the script**

In `index.html`, immediately after the existing `<meta charset="UTF-8" />` line (the very first line inside `<head>`), add:

```html
<script>
  (function () {
    // Anti-FOUC: decide dark/light BEFORE the app bundle loads, so a
    // returning visitor with dark stored never sees a flash of the light
    // theme. Duplicates src/lib/theme.js's getPreferredTheme as plain
    // inline JS on purpose — this runs before any ES module is available,
    // so it can't import that file. Keep the two in sync if this logic
    // ever changes. Wrapped in try/catch: private-mode storage or an
    // unsupported matchMedia must never break page load.
    try {
      var stored = localStorage.getItem('relieve_theme');
      var dark =
        stored === 'dark' ||
        (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (dark) document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: blocking anti-FOUC script for dark mode"
```

---

### Task 4: `src/context/ThemeContext.jsx` — provider + hook

**Files:**
- Create: `src/context/ThemeContext.jsx`

**Interfaces:**
- Consumes: `getStoredTheme`, `setStoredTheme` from `src/lib/theme.js` (Task 1).
- Produces: `ThemeProvider` (component, wraps children), `useTheme()` hook returning `{ theme: 'dark' | 'light', setTheme(next), toggleTheme() }`.

- [ ] **Step 1: Write the file**

Create `src/context/ThemeContext.jsx`:

```jsx
// Dark mode — same context+localStorage shape as CartContext.jsx.
// Initial state is read from document.documentElement's own class (already
// set correctly, before mount, by the blocking script in index.html) —
// not re-derived from localStorage/matchMedia here, so there's no chance
// of this disagreeing with what the user actually sees on first paint.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { setStoredTheme } from '../lib/theme.js';

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    setStoredTheme(window.localStorage, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ThemeContext.jsx
git commit -m "feat: add ThemeContext (dark mode state + persistence)"
```

---

### Task 5: `src/components/ThemeToggle.jsx` — the toggle button

**Files:**
- Create: `src/components/ThemeToggle.jsx`

**Interfaces:**
- Consumes: `useTheme()` from `src/context/ThemeContext.jsx` (Task 4) — `{ theme, toggleTheme }`.
- Produces: default-exported `ThemeToggle` component, no props.

- [ ] **Step 1: Write the file**

Create `src/components/ThemeToggle.jsx`:

```jsx
// Toggle de modo claro/oscuro — porte de AnimatedThemeToggler (Aceternity/
// MagicUI), recortado a la única forma que se usa: círculo (las otras 6 —
// cuadrado/triángulo/diamante/hexágono/rectángulo/estrella — no se
// portan, YAGNI confirmado con el usuario). Sin lucide-react (no está
// instalado, mismo criterio que FluidMenu.jsx) — íconos inline
// stroke="currentColor", mismo estilo que los de ese archivo.
//
// Modo CONTROLADO: lee/escribe el tema vía useTheme() (ThemeContext.jsx),
// nunca localStorage propio — el componente de referencia escribe en
// localStorage.theme por default, la clave equivocada para la convención
// relieve_* de este repo.
//
// bg-graphite/text-gallery-white en vez de tokens dedicados: en modo claro
// es un círculo oscuro con ícono claro; como ambos tokens se invierten
// bajo .dark (src/index.css), en modo oscuro el mismo par de clases da un
// círculo claro con ícono oscuro — la inversión del botón es gratis, viene
// del propio sistema de tokens, no hace falta un color especial para él.
import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from '../context/ThemeContext.jsx';

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

const DURATION_MS = 400;

function circleClipPaths(cx, cy, maxRadius, vw, vh) {
  const toX = (x) => `${(x / vw) * 100}%`;
  const toY = (y) => `${(y / vh) * 100}%`;
  const toRadius = (r) => `${(r / (Math.hypot(vw, vh) / Math.SQRT2)) * 100}%`;
  const point = `${toX(cx)} ${toY(cy)}`;
  return [`circle(0% at ${point})`, `circle(${toRadius(maxRadius)} at ${point})`];
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const buttonRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const isDark = theme === 'dark';

  const onClick = useCallback(() => {
    const button = buttonRef.current;
    if (!button || isTransitioningRef.current) return;

    if (typeof document.startViewTransition !== 'function') {
      toggleTheme();
      return;
    }

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxRadius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
    const clipPath = circleClipPaths(x, y, maxRadius, vw, vh);

    isTransitioningRef.current = true;
    const transition = document.startViewTransition(() => {
      flushSync(toggleTheme);
    });
    transition.finished.finally(() => {
      isTransitioningRef.current = false;
    }).catch(() => {});

    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath },
          { duration: DURATION_MS, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {});
  }, [toggleTheme]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full flex items-center justify-center bg-graphite text-gallery-white"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ThemeToggle.jsx
git commit -m "feat: add ThemeToggle button (circle view-transition)"
```

---

### Task 6: Wire `ThemeProvider` + `ThemeToggle` into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `ThemeProvider` (Task 4), `ThemeToggle` (Task 5).

- [ ] **Step 1: Add the imports**

In `src/App.jsx`, alongside the existing top-of-file imports (`Nav`, `TrustBar`, `CustomCursor`, etc.), add:

```jsx
import { ThemeProvider } from './context/ThemeContext.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
```

- [ ] **Step 2: Wrap the returned tree in `ThemeProvider` and mount `ThemeToggle`**

`App.jsx`'s `export default function App()` currently returns a top-level `<>...</>` fragment containing `<SvgFilters />`, `<PageStamp />`, `<CustomCursor />`, `<TrustBar />`, `<Nav />`, the `LoadingReveal` Suspense, `<CartDrawer />`, the `ProductPanel` Suspense, and the `<Routes>` block, ending with `<Footer />`. Wrap that entire fragment's contents in `<ThemeProvider>` (replacing the outer `<>`/`</>` with `<ThemeProvider>`/`</ThemeProvider>`), and add `<ThemeToggle />` as a sibling alongside the other always-mounted globals (next to `<CartDrawer />` is fine — no ordering dependency):

```jsx
export default function App() {
  return (
    <ThemeProvider>
      <SvgFilters />
      <PageStamp />
      <CustomCursor />
      <TrustBar />
      <Nav />
      <Suspense fallback={null}>
        <LoadingReveal />
      </Suspense>
      <CartDrawer />
      <ThemeToggle />
      <Suspense fallback={null}>
        <ProductPanel />
      </Suspense>
      {/* ...rest of the existing tree (Routes, Footer, etc.) unchanged... */}
    </ThemeProvider>
  );
}
```

(Only the outer `<>`/`</>` → `<ThemeProvider>`/`</ThemeProvider>` swap and the new `<ThemeToggle />` line are new — everything else in the existing return stays exactly as-is, including the commented-out `/regalar` note and whatever routes already follow.)

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire ThemeProvider + ThemeToggle into App"
```

---

### Task 7: Contrast check + Vercel preview verification

**Files:** none (verification only).

- [ ] **Step 1: Push the branch and open a PR to get a Vercel preview URL** (same flow as every other PR in this project — see `docs/superpowers/specs/2026-08-13-dark-mode-design.md` for context).

- [ ] **Step 2: Contrast check** — for every row in the spec's palette table that changed, open the preview in dark mode and check the actual rendered text/background pairs with DevTools' contrast checker (or axe DevTools): normal text needs ≥ 4.5:1, large text (≥ 24px or ≥ 19px bold) needs ≥ 3:1. If any pair fails, adjust that token's dark value in `src/index.css` (Task 2, Step 2) and re-check — don't ship a value that hasn't been measured.

- [ ] **Step 3: Toggle dark mode on each of these and look for anything that reads wrong** (per the spec's verification list):
  - Home (hero + canvas + Curva de Nivel section)
  - A product page (`/pieza/:slug`) — specifically the 3 accent-header pairs flagged in the spec's "Tensión gallery-white" section (walnut/passport-ink/sello-navy backgrounds with `text-gallery-white`) — these may need their own follow-up patch in `Product.jsx` if contrast fails there.
  - `/colecciones`
  - The nav (once PR #199's pill-shrink effect is merged — check both nav states, scrolled and not)
  - The `ThemeToggle` button itself, in both states
  - The loading screen (PR #197, if merged) — uses `bg-piedra`, a token, but confirm visually rather than assuming
  - `CartDrawer` and the quick-buy dialog (PR #196, if merged) — both use `bg-gallery-white`, now inverted; confirm they still read as a coherent "panel" surface
  - Reload the page after toggling to dark — confirm no flash of light theme (the point of Task 3)

- [ ] **Step 4: Fix anything found in Steps 2-3 inline**, in whichever file it lives in, then re-verify that specific spot.
