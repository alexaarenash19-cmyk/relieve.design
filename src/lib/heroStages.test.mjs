// Minimal self-check for issue #46's stage-boundary math.
// Run: node src/lib/heroStages.test.mjs
import assert from 'node:assert';
import { stageProgress, allStageProgress, lerp, clamp01 } from './heroStages.js';

// Stage 1 (index 0) spans progress 0-0.125.
assert.strictEqual(stageProgress(0, 0), 0);
assert.strictEqual(stageProgress(0.0625, 0), 0.5);
assert.strictEqual(stageProgress(0.2, 0), 1);

// Stage 6 (index 5) spans 0.625-0.75; before it starts, progress is 0, not negative.
assert.strictEqual(stageProgress(0.5, 5), 0);
assert.strictEqual(stageProgress(1, 5), 1);

// Stages never overlap: at any progress, at most one stage is strictly between 0 and 1.
for (const p of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
  const active = allStageProgress(p).filter((s) => s > 0 && s < 1);
  assert.ok(active.length <= 1, `progress ${p} activated ${active.length} stages at once`);
}

assert.strictEqual(lerp(0, 10, 0.5), 5);
assert.strictEqual(clamp01(-1), 0);
assert.strictEqual(clamp01(2), 1);

console.log('hero stage math checks: OK');
