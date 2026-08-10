// Pure, testable helpers for the loading-screen reveal
// (src/components/LoadingReveal.jsx) — kept separate from the
// React/GSAP/DOM side so the session-gating and slug-pick logic is
// unit-testable without mocking sessionStorage or a browser environment,
// same split as src/lib/pageWipe.js / src/context/PageWipeContext.jsx.
export const SEEN_KEY = 'relieve_loading_seen';

// The 5 pieces with committed photography today (src/assets/photography/
// pieces/) — one is picked at random per session, not cycled through all
// of them, since the whole reveal is under 1.5s.
export const REVEAL_SLUGS = ['barcelona', 'ciudad-de-mexico', 'londres', 'paris', 'shanghai'];

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

// rand is injected (defaults to Math.random) so the pick is testable
// deterministically.
export function pickRevealSlug(rand = Math.random) {
  return REVEAL_SLUGS[Math.floor(rand() * REVEAL_SLUGS.length)];
}
