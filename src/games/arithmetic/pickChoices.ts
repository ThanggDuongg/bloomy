import { shuffle } from '../../lib/shuffle';

/**
 * Returns 4 shuffled distinct numbers within [0, max] that always include `correct`,
 * preferring numbers close to `correct` as decoys. A [0, max] sibling of the counting
 * game's [1, max] pickChoices — arithmetic results can be 0 (e.g. 1 - 1), which
 * counting's variant can't represent. Assumes max >= 3 (guaranteed by every
 * arithmetic preset's maxResult: 5, 7, or 9).
 */
export function pickChoices(
  correct: number,
  max: number,
  rng: () => number = Math.random,
): number[] {
  const decoys: number[] = [];
  for (let distance = 1; decoys.length < 3 && distance <= max; distance++) {
    for (const candidate of [correct - distance, correct + distance]) {
      if (decoys.length >= 3) break;
      if (candidate >= 0 && candidate <= max && candidate !== correct) {
        decoys.push(candidate);
      }
    }
  }
  return shuffle([correct, ...decoys], rng);
}
