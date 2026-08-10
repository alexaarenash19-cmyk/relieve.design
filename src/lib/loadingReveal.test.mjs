// Run: node src/lib/loadingReveal.test.mjs
import assert from 'node:assert';
import { REVEAL_SLUGS, SEEN_KEY, alreadySeen, markSeen, pickRevealSlug } from './loadingReveal.js';

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

// pickRevealSlug always returns one of the known slugs, and is
// deterministic given an injected rand function.
assert.ok(REVEAL_SLUGS.includes(pickRevealSlug()));
assert.strictEqual(pickRevealSlug(() => 0), REVEAL_SLUGS[0]);
assert.strictEqual(pickRevealSlug(() => 0.999), REVEAL_SLUGS[REVEAL_SLUGS.length - 1]);

console.log('loading reveal helper checks: OK');
