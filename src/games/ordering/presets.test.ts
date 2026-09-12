import { describe, it, expect } from 'vitest';
import { orderingPresets, getOrderingPreset } from './presets';

describe('orderingPresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(orderingPresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('decreases minGap and keeps itemCount/questions non-decreasing from easy to hard', () => {
    const [easy, medium, hard] = orderingPresets;
    expect(easy.config.minGap).toBeGreaterThan(medium.config.minGap);
    expect(medium.config.minGap).toBeGreaterThan(hard.config.minGap);
    expect(easy.config.itemCount).toBeLessThanOrEqual(medium.config.itemCount);
    expect(medium.config.itemCount).toBeLessThanOrEqual(hard.config.itemCount);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getOrderingPreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getOrderingPreset('easy')).toEqual({ questions: 5, itemCount: 3, minGap: 3 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getOrderingPreset('nope')).toThrow('Unknown ordering preset: nope');
  });
});
