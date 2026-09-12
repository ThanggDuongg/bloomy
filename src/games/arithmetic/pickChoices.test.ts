import { describe, it, expect } from 'vitest';
import { pickChoices } from './pickChoices';

describe('pickChoices', () => {
  it('always includes the correct answer', () => {
    const choices = pickChoices(3, 9, () => 0.5);
    expect(choices).toContain(3);
  });

  it('returns 4 distinct numbers within [0, max]', () => {
    const choices = pickChoices(3, 9, () => 0.5);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    for (const n of choices) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('still returns 4 distinct numbers when the correct answer is 0', () => {
    const choices = pickChoices(0, 9, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([0, 1, 2, 3]));
  });

  it('still returns 4 distinct numbers when the correct answer is the max', () => {
    const choices = pickChoices(9, 9, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([9, 8, 7, 6]));
  });

  it('prefers decoys close to the correct answer', () => {
    const choices = pickChoices(5, 9, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([3, 4, 5, 6]));
  });
});
