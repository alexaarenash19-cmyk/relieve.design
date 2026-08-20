// Run: node src/lib/loadingReveal.test.mjs
import assert from 'node:assert';
import {
  DEFAULT_DURATION_MS,
  REVEAL_SLUGS,
  SEEN_KEY,
  alreadySeen,
  markSeen,
  parseCssDurationMs,
  pickRevealStartIndex,
  shouldSkipReveal,
} from './loadingReveal.js';

// Minimal in-memory stand-in for sessionStorage.
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

// Fresh session: not seen yet.
assert.strictEqual(alreadySeen(fakeStorage()), false);

// After marking, the same storage reports seen.
const storage = fakeStorage();
markSeen(storage);
assert.strictEqual(alreadySeen(storage), true);
assert.strictEqual(storage.getItem(SEEN_KEY), '1');

// A storage that throws (disabled/private mode) is treated as "not seen"
// rather than crashing — matches Home.jsx's own HERO_SEEN_KEY fallback.
const throwingStorage = {
  getItem() {
    throw new Error('disabled');
  },
  setItem() {
    throw new Error('disabled');
  },
};
assert.strictEqual(alreadySeen(throwingStorage), false);
markSeen(throwingStorage); // must not throw

// No storage at all (undefined) — same safe fallback.
assert.strictEqual(alreadySeen(undefined), false);
markSeen(undefined); // must not throw

// parseCssDurationMs parses "3s" / "600ms" (with stray whitespace) to
// milliseconds, and falls back to DEFAULT_DURATION_MS for unparseable input.
assert.strictEqual(parseCssDurationMs('3s'), 3000);
assert.strictEqual(parseCssDurationMs('600ms'), 600);
assert.strictEqual(parseCssDurationMs(' 0.5s '), 500);
assert.strictEqual(parseCssDurationMs('garbage'), DEFAULT_DURATION_MS);

// pickRevealStartIndex always returns a valid index into REVEAL_SLUGS, and
// is deterministic given an injected rand function.
assert.ok(pickRevealStartIndex() < REVEAL_SLUGS.length);
assert.strictEqual(pickRevealStartIndex(() => 0), 0);
assert.strictEqual(pickRevealStartIndex(() => 0.999), REVEAL_SLUGS.length - 1);

// shouldSkipReveal matches /personaliza with or without a trailing slash,
// case-insensitively, and leaves other routes alone.
assert.strictEqual(shouldSkipReveal('/personaliza'), true);
assert.strictEqual(shouldSkipReveal('/personaliza/'), true);
assert.strictEqual(shouldSkipReveal('/Personaliza'), true);
assert.strictEqual(shouldSkipReveal('/colecciones'), false);

console.log('loading reveal helper checks: OK');
