import { describe, it, expect } from 'vitest';
import { buildDeck } from './deck';

describe('buildDeck', () => {
  it('produces two cards per item', () => {
    const deck = buildDeck(['apple', 'banana', 'orange']);
    expect(deck).toHaveLength(6);
    const counts = deck.reduce<Record<string, number>>((acc, c) => {
      acc[c.itemId] = (acc[c.itemId] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ apple: 2, banana: 2, orange: 2 });
  });

  it('gives every card a unique key', () => {
    const deck = buildDeck(['apple', 'banana']);
    const keys = deck.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
