import { describe, it, expect } from 'vitest';
import { countingPresets, getCountingPreset } from './presets';

describe('countingPresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(countingPresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('increases maxNumber and questions from easy to hard', () => {
    const [easy, medium, hard] = countingPresets;
    expect(easy.config.maxNumber).toBeLessThan(medium.config.maxNumber);
    expect(medium.config.maxNumber).toBeLessThan(hard.config.maxNumber);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getCountingPreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getCountingPreset('easy')).toEqual({ maxNumber: 5, questions: 5 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getCountingPreset('nope')).toThrow('Unknown counting preset: nope');
  });
});
