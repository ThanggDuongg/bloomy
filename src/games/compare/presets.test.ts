import { describe, it, expect } from 'vitest';
import { comparePresets, getComparePreset } from './presets';

describe('comparePresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(comparePresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('decreases minGap and increases questions from easy to hard', () => {
    const [easy, medium, hard] = comparePresets;
    expect(easy.config.minGap).toBeGreaterThan(medium.config.minGap);
    expect(medium.config.minGap).toBeGreaterThan(hard.config.minGap);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getComparePreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getComparePreset('easy')).toEqual({ questions: 5, minGap: 4 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getComparePreset('nope')).toThrow('Unknown compare preset: nope');
  });
});
