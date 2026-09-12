import { describe, it, expect } from 'vitest';
import { pickOther } from './pickOther';

describe('pickOther', () => {
  it('returns a value within [1, max] for every starting value', () => {
    for (let a = 1; a <= 10; a++) {
      const b = pickOther(a, 4, 10, () => 0.5);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it('is always at least minGap away from a', () => {
    for (let a = 1; a <= 10; a++) {
      const b = pickOther(a, 4, 10, () => 0.5);
      expect(Math.abs(a - b)).toBeGreaterThanOrEqual(4);
    }
  });

  it('works at the low and high boundary values of a with a small minGap', () => {
    expect(Math.abs(1 - pickOther(1, 1, 10, () => 0))).toBeGreaterThanOrEqual(1);
    expect(Math.abs(10 - pickOther(10, 1, 10, () => 0.999))).toBeGreaterThanOrEqual(1);
  });

  it('varies with rng across its full [0, 1) domain', () => {
    const low = pickOther(5, 1, 10, () => 0);
    const high = pickOther(5, 1, 10, () => 0.999);
    expect(low).not.toBe(high);
  });
});
