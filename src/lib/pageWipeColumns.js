// Phase-sequencing + column math for the vertical-columns page wipe
// (Explorar spec §9 — full-screen wipe in vertical column strips, distinct
// from the single continuous sweep in lib/pageWipe.js). Reuses the exact
// same idle/covering/covered/uncovering phase shape as pageWipe.js so
// PageWipeContext.jsx can drive either variant with one choreography —
// only the per-column stagger math below is new.
export { PHASES, nextPhase } from './pageWipe.js';

const MOBILE_BREAKPOINT = 640;

// Spec §9.2 — fewer, wider columns on a narrow viewport so it still reads
// as intentional instead of a dozen slivers on a phone screen.
export function columnsForWidth(width) {
  return width < MOBILE_BREAKPOINT ? 3 : 6;
}

// Spreads `count` columns' start times across `totalMs` (the wipe's own
// cover/uncover duration, §10: 0.6-1s total) so the last column still
// finishes inside that budget — staggerMs is derived, not fixed, so it
// scales down automatically if totalMs is ever tuned smaller.
export function columnDelayMs(index, count, totalMs) {
  if (count <= 1) return 0;
  const staggerMs = totalMs * 0.35;
  return (staggerMs / (count - 1)) * index;
}
