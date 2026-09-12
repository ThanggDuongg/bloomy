import { shuffle } from '../../lib/shuffle';

/**
 * Returns 4 shuffled distinct numbers within [1, max] that always include `correct`,
 * preferring numbers close to `correct` as decoys (a far-off wrong answer is too easy
 * to rule out on sight, which defeats the point of counting practice). Assumes
 * max >= 4 — guaranteed by every counting preset's maxNumber (5, 8, or 10).
 */
export function pickChoices(
  correct: number,
  max: number,
  rng: () => number = Math.random,
): number[] {
  const decoys: number[] = [];
  for (let distance = 1; decoys.length < 3 && distance < max; distance++) {
    for (const candidate of [correct - distance, correct + distance]) {
      if (decoys.length >= 3) break;
      if (candidate >= 1 && candidate <= max && candidate !== correct) {
        decoys.push(candidate);
      }
    }
  }
  return shuffle([correct, ...decoys], rng);
}
