import { describe, it, expect } from 'vitest';
import { pickChoices } from './pickChoices';

describe('pickChoices', () => {
  it('always includes the correct answer', () => {
    const choices = pickChoices(3, 10, () => 0.5);
    expect(choices).toContain(3);
  });

  it('returns 4 distinct numbers within [1, max]', () => {
    const choices = pickChoices(3, 10, () => 0.5);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    for (const n of choices) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('prefers decoys close to the correct answer', () => {
    const choices = pickChoices(5, 10, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([3, 4, 5, 6]));
  });

  it('still returns 4 distinct numbers near the low edge of the range', () => {
    const choices = pickChoices(1, 5, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([1, 2, 3, 4]));
  });

  it('still returns 4 distinct numbers near the high edge of the range', () => {
    const choices = pickChoices(10, 10, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([7, 8, 9, 10]));
  });
});
