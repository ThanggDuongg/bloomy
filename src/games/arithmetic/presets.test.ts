import { describe, it, expect } from 'vitest';
import { arithmeticPresets, getArithmeticPreset } from './presets';

describe('arithmeticPresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(arithmeticPresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('increases maxResult and questions from easy to hard, capped at a single digit', () => {
    const [easy, medium, hard] = arithmeticPresets;
    expect(easy.config.maxResult).toBeLessThan(medium.config.maxResult);
    expect(medium.config.maxResult).toBeLessThan(hard.config.maxResult);
    expect(hard.config.maxResult).toBeLessThanOrEqual(9);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getArithmeticPreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getArithmeticPreset('easy')).toEqual({ questions: 5, maxResult: 5 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getArithmeticPreset('nope')).toThrow('Unknown arithmetic preset: nope');
  });
});
