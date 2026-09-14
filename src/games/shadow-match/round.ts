import { shuffle } from '../../lib/shuffle';

export interface ShadowRound {
  /** Item ids for the left (draggable) column, in shuffled order. */
  items: string[];
  /** Item ids for the right (shadow slot) column, shuffled independently. */
  slots: string[];
}

export function buildShadowRound(
  itemIds: readonly string[],
  rng: () => number = Math.random,
): ShadowRound {
  return {
    items: shuffle(itemIds, rng),
    slots: shuffle(itemIds, rng),
  };
}
