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

// Real-world pools/counts never need more than a few hundred draw attempts to
// satisfy both constraints below; this is only a safety valve against a runaway
// loop, not a realistic limit.
const MAX_ITERATIONS = 10_000;

/**
 * Draws `count` ids without repeating until the pool is exhausted.
 * When the current bag runs dry, it is refilled from a fresh shuffle of `allIds`.
 *
 * Within a single call the drawn ids are always distinct (as long as
 * `count <= allIds.length`): if a refill would hand back an id already drawn
 * this round, that id is held aside and returned to the front of the bag so it
 * stays available for the next round instead of duplicating within this one.
 *
 * `groupOf`, if given, additionally ensures at most one id per shape-group is
 * drawn in a single call (e.g. don't show two look-alike silhouettes in the same
 * round) — unless `count` exceeds the number of distinct groups available, in
 * which case the constraint is impossible to satisfy and is skipped entirely.
 */
export function drawFromBag(
  allIds: readonly string[],
  count: number,
  state: BagState,
  rng: () => number = Math.random,
  groupOf?: (id: string) => string,
): { drawn: string[]; state: BagState } {
  const distinct = count <= allIds.length;
  const groupCount = groupOf ? new Set(allIds.map(groupOf)).size : 0;
  const enforceGroups = Boolean(groupOf) && count <= groupCount;

  let bag = [...state.remaining];
  const drawn: string[] = [];
  const held: string[] = [];
  const usedGroups = new Set<string>();

  for (let iteration = 0; drawn.length < count; iteration++) {
    if (iteration >= MAX_ITERATIONS) {
      // Should be unreachable for any realistic pool/count, but never hang the
      // caller — fill the rest of the round ignoring the constraints.
      drawn.push(...bag.splice(0, count - drawn.length));
      break;
    }
    if (bag.length === 0) {
      bag = shuffle(allIds, rng);
    }
    const next = bag.shift()!;
    if (distinct && drawn.includes(next)) {
      held.push(next);
      continue;
    }
    if (enforceGroups) {
      const group = groupOf!(next);
      if (usedGroups.has(group)) {
        held.push(next);
        continue;
      }
      usedGroups.add(group);
    }
    drawn.push(next);
  }

  return { drawn, state: { remaining: [...held, ...bag] } };
}
