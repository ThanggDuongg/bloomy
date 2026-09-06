import { shuffle } from '../../lib/shuffle';

export interface Card {
  key: string;
  itemId: string;
}

export function buildDeck(itemIds: readonly string[], rng: () => number = Math.random): Card[] {
  const cards: Card[] = itemIds.flatMap((itemId) => [
    { key: `${itemId}-a`, itemId },
    { key: `${itemId}-b`, itemId },
  ]);
  return shuffle(cards, rng);
}
