import { describe, it, expect } from 'vitest';
import { drawFromBag, type BagState } from './bag';

const ids = ['a', 'b', 'c', 'd'];

describe('drawFromBag', () => {
  it('draws the requested count', () => {
    const { drawn } = drawFromBag(ids, 2, { remaining: [] });
    expect(drawn).toHaveLength(2);
  });

  it('draws only ids from the pool', () => {
    const { drawn } = drawFromBag(ids, 2, { remaining: [] });
    for (const id of drawn) expect(ids).toContain(id);
  });

  it('does not repeat an id until the pool is exhausted', () => {
    let state: BagState = { remaining: [] };
    const seen: string[] = [];
    // Draw 2 at a time, twice => 4 draws should cover the whole pool with no repeats
    for (let round = 0; round < 2; round++) {
      const res = drawFromBag(ids, 2, state);
      state = res.state;
      seen.push(...res.drawn);
    }
    expect(new Set(seen).size).toBe(4);
  });

  it('refills when the remaining bag is smaller than count, without in-round duplicates', () => {
    const { drawn, state } = drawFromBag(ids, 3, { remaining: ['a'] });
    expect(drawn).toHaveLength(3);
    // All three drawn ids are distinct even across the refill boundary.
    expect(new Set(drawn).size).toBe(3);
    // 1 id came from the old bag; count-1 fresh distinct ids came from the refill,
    // leaving pool - (count - 1) ids available for the next round.
    expect(state.remaining.length).toBe(ids.length - (3 - 1));
  });

  it('never draws duplicates within a round across many refills', () => {
    let state: BagState = { remaining: [] };
    for (let round = 0; round < 20; round++) {
      const res = drawFromBag(ids, 3, state);
      state = res.state;
      expect(new Set(res.drawn).size).toBe(3);
    }
  });

  describe('groupOf (at most one id per shape-group per round)', () => {
    // a and b look-alike (same group); c and d are each visually unique.
    const groupOf = (id: string) => (id === 'a' || id === 'b' ? 'lookalike' : id);

    it('never draws two ids from the same group in one call', () => {
      let state: BagState = { remaining: [] };
      for (let round = 0; round < 30; round++) {
        const res = drawFromBag(ids, 2, state, Math.random, groupOf);
        state = res.state;
        const groups = res.drawn.map(groupOf);
        expect(new Set(groups).size).toBe(res.drawn.length);
      }
    });

    it('still draws the requested count', () => {
      const { drawn } = drawFromBag(ids, 2, { remaining: [] }, Math.random, groupOf);
      expect(drawn).toHaveLength(2);
    });

    it('falls back to ignoring the constraint when count exceeds the number of groups', () => {
      // Only 3 distinct groups exist (lookalike, c, d) but 4 are requested.
      const { drawn } = drawFromBag(ids, 4, { remaining: [] }, Math.random, groupOf);
      expect(drawn).toHaveLength(4);
    });
  });
});
