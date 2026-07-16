// Issue #46 — maps the 0-1 hero scroll progress (from HeroScrollContext) onto
// the 8 storyboard stages (ui-ux.md), each an equal eighth of the range.
export const STAGE_COUNT = 8;

export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// stageProgress(p, 0) = progress through stage 1 (0-0.125), etc.
export function stageProgress(progress, stageIndex) {
  const start = stageIndex / STAGE_COUNT;
  const end = (stageIndex + 1) / STAGE_COUNT;
  return clamp01((progress - start) / (end - start));
}

export function allStageProgress(progress) {
  return Array.from({ length: STAGE_COUNT }, (_, i) => stageProgress(progress, i));
}
