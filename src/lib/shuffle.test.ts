import { describe, it, expect } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns a permutation with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(5);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it('is deterministic given a fixed rng', () => {
    // rng always returns 0 => Fisher-Yates picks index 0 each step
    const out = shuffle(['a', 'b', 'c'], () => 0);
    expect(out).toEqual(['b', 'c', 'a']);
  });
});
