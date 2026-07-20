// Run: node src/lib/pageWipe.test.mjs
import assert from 'node:assert';
import { PHASES, TRANSLATE_Y, nextPhase } from './pageWipe.js';

// Cycles idle -> covering -> covered -> uncovering -> idle, never skipping
// a phase or getting stuck.
assert.deepStrictEqual(PHASES.map(nextPhase), ['covering', 'covered', 'uncovering', 'idle']);

// Every phase has a translateY value, so the component can never render an
// undefined transform for a phase that exists.
for (const phase of PHASES) {
  assert.ok(TRANSLATE_Y[phase], `missing TRANSLATE_Y for phase "${phase}"`);
}

// covering and covered are both fully on-screen (0%) so the hold phase
// doesn't visually move; idle and uncovering exit on opposite edges.
assert.strictEqual(TRANSLATE_Y.covering, TRANSLATE_Y.covered);
assert.notStrictEqual(TRANSLATE_Y.idle, TRANSLATE_Y.uncovering);

assert.throws(() => nextPhase('bogus'), /Unknown wipe phase/);

console.log('page wipe phase sequencing checks: OK');
