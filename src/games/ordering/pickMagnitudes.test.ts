import { describe, it, expect } from 'vitest';
import { pickMagnitudes } from './pickMagnitudes';

describe('pickMagnitudes', () => {
  it('returns itemCount ascending magnitudes within [1, max]', () => {
    const values = pickMagnitudes(3, 3, 10, () => 0.5);
    expect(values).toHaveLength(3);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('keeps every consecutive gap at least minGap apart', () => {
    const values = pickMagnitudes(4, 2, 10, () => 0.5);
    for (let i = 1; i < values.length; i++) {
      expect(values[i] - values[i - 1]).toBeGreaterThanOrEqual(2);
    }
  });

  it('varies the starting point with rng when there is slack', () => {
    const low = pickMagnitudes(3, 2, 10, () => 0);
    const high = pickMagnitudes(3, 2, 10, () => 0.999);
    expect(low[0]).not.toBe(high[0]);
  });

  it('produces a fixed, valid sequence when there is no slack', () => {
    const values = pickMagnitudes(4, 3, 10, () => 0.999);
    expect(values).toEqual([1, 4, 7, 10]);
  });
});
