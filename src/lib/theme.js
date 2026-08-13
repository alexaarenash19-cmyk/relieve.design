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
