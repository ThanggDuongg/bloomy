/**
 * Returns a value in [1, max] that's at least `minGap` away from `a`, without a
 * rejection-sampling loop (a fixed/degenerate rng would otherwise loop forever) —
 * maps rng's output directly onto the valid values below and above `a`. Assumes a
 * valid value always exists for the configured (minGap, max) — true for every
 * compare preset's minGap (4, 2, or 1) against max = 10.
 */
export function pickOther(
  a: number,
  minGap: number,
  max: number,
  rng: () => number = Math.random,
): number {
  const belowCount = Math.max(0, a - minGap);
  const aboveCount = Math.max(0, max - (a + minGap) + 1);
  const total = belowCount + aboveCount;
  const r = Math.floor(rng() * total);
  return r < belowCount ? 1 + r : a + minGap + (r - belowCount);
}
