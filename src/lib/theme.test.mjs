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
