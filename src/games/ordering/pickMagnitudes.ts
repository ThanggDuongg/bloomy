/**
 * Returns `itemCount` ascending magnitudes in [1, max], each consecutive pair at
 * least `minGap` apart, without a rejection-sampling loop — computes a shared random
 * offset within the available slack instead of retrying. Assumes
 * minGap * (itemCount - 1) <= max - 1, true for every ordering preset (span 6, 4, or
 * 3 against max - 1 = 9).
 */
export function pickMagnitudes(
  itemCount: number,
  minGap: number,
  max: number,
  rng: () => number = Math.random,
): number[] {
  const span = minGap * (itemCount - 1);
  const slack = max - 1 - span;
  const shift = Math.floor(rng() * (slack + 1));
  const start = 1 + shift;
  return Array.from({ length: itemCount }, (_, i) => start + i * minGap);
}
