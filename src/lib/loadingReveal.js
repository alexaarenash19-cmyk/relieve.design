// Pure, testable helpers for the loading-screen reveal
// (src/components/LoadingReveal.jsx) — kept separate from the
// React/GSAP/DOM side so the session-gating and slug-pick logic is
// unit-testable without mocking sessionStorage or a browser environment,
// same split as src/lib/pageWipe.js / src/context/PageWipeContext.jsx.
export const SEEN_KEY = 'relieve_loading_seen';

// The 5 pieces with committed photography today (src/assets/photography/
// pieces/) — rotated through starting at a random index per session, over
// the reveal duration set by --loading-reveal-duration in src/index.css.
export const REVEAL_SLUGS = [
  'barcelona',
  'ciudad-de-mexico',
  'londres',
  'paris',
  'shanghai',
];

// Fallback used only if getComputedStyle can't resolve the CSS custom
// property (--loading-reveal-duration, set in src/index.css) — not the
// source of truth, the live CSS var is.
export const DEFAULT_DURATION_MS = 3000;

// storage is injected (sessionStorage in the browser) so this stays
// testable without a DOM/window global.
export function alreadySeen(storage) {
  try {
    return storage?.getItem(SEEN_KEY) === '1';
  } catch {
    return false; // storage disabled/unavailable — treat as first visit, harmless replay
  }
}

export function markSeen(storage) {
  try {
    storage?.setItem(SEEN_KEY, '1');
  } catch {
    // storage unavailable — not fatal, it'll just replay next load
  }
}

// Parses a CSS <time> value ("3s", "600ms", with optional surrounding
// whitespace) to milliseconds. Pure — no DOM/getComputedStyle — falls back
// to `fallback` for anything it can't parse.
export function parseCssDurationMs(raw, fallback = DEFAULT_DURATION_MS) {
  const match = String(raw)
    .trim()
    .match(/^([\d.]+)(ms|s)$/);
  if (!match) return fallback;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return fallback;
  return match[2] === 's' ? value * 1000 : value;
}

// rand is injected (defaults to Math.random) so the pick is testable
// deterministically. Returns the starting index into REVEAL_SLUGS for the
// rotation.
export function pickRevealStartIndex(rand = Math.random) {
  return Math.floor(rand() * REVEAL_SLUGS.length);
}

// Skip the reveal on /personaliza (checkout) — a returning visitor mid
// checkout shouldn't get the full-screen preloader on top of it. Matches
// with or without a trailing slash, case-insensitively (route paths are
// lowercase by convention in this app, but a stray case variant shouldn't
// slip past the check).
export function shouldSkipReveal(pathname) {
  const normalized = String(pathname).toLowerCase().replace(/\/$/, '');
  return normalized === '/personaliza';
}
