import { shuffle } from './shuffle';

export interface BagState {
  remaining: string[];
}

export function loadBag(storageKey: string): BagState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as BagState;
  } catch {
    // ignore malformed storage
  }
  return { remaining: [] };
}

export function saveBag(storageKey: string, state: BagState): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // ignore storage write failures
  }
}

/**
 * Draws `count` ids without repeating until the pool is exhausted.
 * When the current bag runs dry, it is refilled from a fresh shuffle of `allIds`.
 *
 * Within a single call the drawn ids are always distinct (as long as
 * `count <= allIds.length`): if a refill would hand back an id already drawn
 * this round, that id is held aside and returned to the front of the bag so it
 * stays available for the next round instead of duplicating within this one.
 */
export function drawFromBag(
  allIds: readonly string[],
  count: number,
  state: BagState,
  rng: () => number = Math.random,
): { drawn: string[]; state: BagState } {
  const distinct = count <= allIds.length;
  let bag = [...state.remaining];
  const drawn: string[] = [];
  const held: string[] = [];

  while (drawn.length < count) {
    if (bag.length === 0) {
      bag = shuffle(allIds, rng);
    }
    const next = bag.shift()!;
    if (distinct && drawn.includes(next)) {
      held.push(next);
    } else {
      drawn.push(next);
    }
  }

  return { drawn, state: { remaining: [...held, ...bag] } };
}
