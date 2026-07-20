// Pure phase-sequencing for the fullscreen page wipe transition
// (src/context/PageWipeContext.jsx) — kept separate from the timers/React
// state so the sequence itself is unit-testable without mocking setTimeout.
// A single continuous upward sweep: idle (off-screen below) -> covering
// (slides up to cover) -> covered (holds, full screen) -> uncovering
// (continues sliding up, exits off the top) -> idle.
export const PHASES = ['idle', 'covering', 'covered', 'uncovering'];

export const TRANSLATE_Y = {
  idle: '100%',
  covering: '0%',
  covered: '0%',
  uncovering: '-100%',
};

export function nextPhase(phase) {
  const i = PHASES.indexOf(phase);
  if (i === -1) throw new Error(`Unknown wipe phase: ${phase}`);
  return PHASES[(i + 1) % PHASES.length];
}
