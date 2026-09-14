import { describe, it, expect } from 'vitest';
import { buildShadowRound } from './round';

describe('buildShadowRound', () => {
  it('produces one item entry and one slot entry per id', () => {
    const round = buildShadowRound(['apple', 'banana', 'grape']);
    expect(round.items).toHaveLength(3);
    expect(round.slots).toHaveLength(3);
    expect([...round.items].sort()).toEqual(['apple', 'banana', 'grape']);
    expect([...round.slots].sort()).toEqual(['apple', 'banana', 'grape']);
  });

  it('shuffles items and slots independently given a fixed rng', () => {
    // rng always 0 => Fisher-Yates rotates the array by one each time
    const round = buildShadowRound(['a', 'b', 'c'], () => 0);
    expect(round.items).toEqual(['b', 'c', 'a']);
    expect(round.slots).toEqual(['b', 'c', 'a']);
  });
});
