# Ordering Game ("Sắp xếp kích thước") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a seventh game, "Sắp xếp kích thước" (📏), where the child drags several differently-sized shapes into slots ordered smallest → largest, across a session of several rounds sized by a Dễ/Vừa/Khó preset.

**Architecture:** A self-contained `src/games/ordering/` module (presets data, a pure `pickMagnitudes` size picker, a `useOrdering` round-and-drag-sequencing hook, and an `OrderingBoard` component), plugged into `registry.ts`/`boards.tsx`. This game reuses the counting game's `noCategories`/`presets`/`roundKey` infrastructure (zero changes to `App.tsx`/`SetupScreen.tsx`/`GameScreen.tsx`), the shared `SHAPES` list, and the Sort/Shadow-Match games' drag-and-drop hit-testing (`src/lib/hitTest.ts`). It does **not** reuse `useSort` directly — `useSort` has no concept of a multi-round session, and this game needs both a round sequence (like counting/compare/arithmetic) and per-round drag-and-drop matching (like Sort), so it gets its own hook that combines both.

**Tech Stack:** React 19 + TypeScript (strict), Tailwind CSS v4, Motion (`motion/react`), Vitest + `@testing-library/react`.

## Global Constraints

- No backend/database — this game is entirely computed client-side (no new localStorage keys).
- Player-facing strings in Vietnamese, matching every other game's copy.
- oxlint (not ESLint) is the linter; disable-comments (if ever needed) use `oxlint-disable-next-line <rule>` syntax placed directly above the flagged line.
- Only smallest → largest ordering is in scope — never largest → smallest, never mixed, per the user's explicit choice for a simpler, single-direction design.
- Ordering by anything other than size (e.g. quantity) is out of scope.
- More than 4 items per round is out of scope (would crowd the slot row for this age group).
- The counting, compare, arithmetic, sort, shadow-match, and memory-match games must keep passing their current tests and behavior unchanged.

---

### Task 1: Ordering presets data

**Files:**
- Create: `src/games/ordering/presets.ts`
- Test: `src/games/ordering/presets.test.ts`

**Interfaces:**
- Produces: `OrderingConfig { questions: number; itemCount: number; minGap: number }`, `OrderingPreset { id: string; name: string; config: OrderingConfig }`, `orderingPresets: OrderingPreset[]`, `getOrderingPreset(id: string): OrderingConfig` (throws `Error` on unknown id).

- [ ] **Step 1: Write the failing test**

```ts
// src/games/ordering/presets.test.ts
import { describe, it, expect } from 'vitest';
import { orderingPresets, getOrderingPreset } from './presets';

describe('orderingPresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(orderingPresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('decreases minGap and keeps itemCount/questions non-decreasing from easy to hard', () => {
    const [easy, medium, hard] = orderingPresets;
    expect(easy.config.minGap).toBeGreaterThan(medium.config.minGap);
    expect(medium.config.minGap).toBeGreaterThan(hard.config.minGap);
    expect(easy.config.itemCount).toBeLessThanOrEqual(medium.config.itemCount);
    expect(medium.config.itemCount).toBeLessThanOrEqual(hard.config.itemCount);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getOrderingPreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getOrderingPreset('easy')).toEqual({ questions: 5, itemCount: 3, minGap: 3 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getOrderingPreset('nope')).toThrow('Unknown ordering preset: nope');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/ordering/presets.test.ts`
Expected: FAIL — `Cannot find module './presets'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/ordering/presets.ts
export interface OrderingConfig {
  /** How many rounds make up one session. */
  questions: number;
  /** How many shapes the player sorts per round. */
  itemCount: number;
  /** Minimum gap between consecutive sorted magnitudes, in [1, 10] — a smaller gap
   *  makes the sizes look more alike, which is harder to compare at a glance. */
  minGap: number;
}

export interface OrderingPreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: OrderingConfig;
}

export const orderingPresets: OrderingPreset[] = [
  { id: 'easy', name: 'Dễ', config: { questions: 5, itemCount: 3, minGap: 3 } },
  { id: 'medium', name: 'Vừa', config: { questions: 6, itemCount: 3, minGap: 2 } },
  { id: 'hard', name: 'Khó', config: { questions: 7, itemCount: 4, minGap: 1 } },
];

export function getOrderingPreset(id: string): OrderingConfig {
  const preset = orderingPresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown ordering preset: ${id}`);
  return preset.config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/ordering/presets.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/ordering/presets.ts src/games/ordering/presets.test.ts
git commit -m "feat: add ordering game difficulty presets"
```

---

### Task 2: Magnitude picker (`pickMagnitudes`)

**Files:**
- Create: `src/games/ordering/pickMagnitudes.ts`
- Test: `src/games/ordering/pickMagnitudes.test.ts`

**Interfaces:**
- Produces: `pickMagnitudes(itemCount: number, minGap: number, max: number, rng?: () => number): number[]` — returns `itemCount` ascending values in `[1, max]`, each consecutive pair at least `minGap` apart. Assumes `minGap * (itemCount - 1) <= max - 1` — true for every ordering preset against `max = 10` (spans of 6, 4, and 3 against `max - 1 = 9`).

- [ ] **Step 1: Write the failing test**

```ts
// src/games/ordering/pickMagnitudes.test.ts
import { describe, it, expect } from 'vitest';
import { pickMagnitudes } from './pickMagnitudes';

describe('pickMagnitudes', () => {
  it('returns itemCount ascending magnitudes within [1, max]', () => {
    const values = pickMagnitudes(3, 3, 10, () => 0.5);
    expect(values).toHaveLength(3);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('keeps every consecutive gap at least minGap apart', () => {
    const values = pickMagnitudes(4, 2, 10, () => 0.5);
    for (let i = 1; i < values.length; i++) {
      expect(values[i] - values[i - 1]).toBeGreaterThanOrEqual(2);
    }
  });

  it('varies the starting point with rng when there is slack', () => {
    const low = pickMagnitudes(3, 2, 10, () => 0);
    const high = pickMagnitudes(3, 2, 10, () => 0.999);
    expect(low[0]).not.toBe(high[0]);
  });

  it('produces a fixed, valid sequence when there is no slack', () => {
    const values = pickMagnitudes(4, 3, 10, () => 0.999);
    expect(values).toEqual([1, 4, 7, 10]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/ordering/pickMagnitudes.test.ts`
Expected: FAIL — `Cannot find module './pickMagnitudes'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/ordering/pickMagnitudes.ts
/**
 * Returns `itemCount` ascending magnitudes in [1, max], each consecutive pair at
 * least `minGap` apart, without a rejection-sampling loop — computes a shared random
 * offset within the available slack instead of retrying. Assumes
 * minGap * (itemCount - 1) <= max - 1, true for every ordering preset (span 6, 4, or
 * 3 against max - 1 = 9).
 */
export function pickMagnitudes(
  itemCount: number,
  minGap: number,
  max: number,
  rng: () => number = Math.random,
): number[] {
  const span = minGap * (itemCount - 1);
  const slack = max - 1 - span;
  const shift = Math.floor(rng() * (slack + 1));
  const start = 1 + shift;
  return Array.from({ length: itemCount }, (_, i) => start + i * minGap);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/ordering/pickMagnitudes.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/ordering/pickMagnitudes.ts src/games/ordering/pickMagnitudes.test.ts
git commit -m "feat: add pickMagnitudes for the ordering game"
```

---

### Task 3: Round-and-drag-sequencing hook (`useOrdering`)

**Files:**
- Create: `src/games/ordering/useOrdering.ts`
- Test: `src/games/ordering/useOrdering.test.ts`

**Interfaces:**
- Consumes: `OrderingConfig` from `./presets` (Task 1); `pickMagnitudes` from `./pickMagnitudes` (Task 2); `SHAPES` from `../shapes` (already exists); `shuffle` from `src/lib/shuffle.ts` — `shuffle<T>(input: readonly T[], rng?: () => number): T[]`.
- Produces: `Item { id: string; magnitude: number }`; `useOrdering(config: OrderingConfig, options: { onComplete: () => void; onMatch?: () => void; onMismatch?: () => void; rng?: () => number }): { round: number; totalQuestions: number; shape: string; itemCount: number; items: Item[]; matched: Set<string>; isComplete: boolean; handleDrop: (itemId: string, targetSlot: string | null) => void }`. `items` contains only the items still unmatched (in the tray) for the current round. `handleDrop`'s `targetSlot` is the slot id as a decimal string (`"0"`, `"1"`, ...) — matching `findMatchingSlot`'s return type from `src/lib/hitTest.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/games/ordering/useOrdering.test.ts
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOrdering } from './useOrdering';

const config = { questions: 2, itemCount: 3, minGap: 3 };
const rng = () => 0.5;

function sortedIds(items: { id: string; magnitude: number }[]) {
  return [...items].sort((a, b) => a.magnitude - b.magnitude).map((i) => i.id);
}

describe('useOrdering', () => {
  it('starts at round 0 with itemCount distinct-magnitude items in the tray', () => {
    const { result } = renderHook(() => useOrdering(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(2);
    expect(result.current.items).toHaveLength(3);
    expect(new Set(result.current.items.map((i) => i.magnitude)).size).toBe(3);
  });

  it('marks an item matched and removes it from the tray on a correct-slot drop', () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useOrdering(config, { onComplete: vi.fn(), onMatch, rng }));
    const order = sortedIds(result.current.items);
    const smallestId = order[0];
    act(() => {
      result.current.handleDrop(smallestId, '0');
    });
    expect(result.current.matched.has(smallestId)).toBe(true);
    expect(result.current.items.some((i) => i.id === smallestId)).toBe(false);
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('does not mark matched on a wrong-slot drop and fires onMismatch', () => {
    const onMismatch = vi.fn();
    const { result } = renderHook(() =>
      useOrdering(config, { onComplete: vi.fn(), onMismatch, rng }),
    );
    const order = sortedIds(result.current.items);
    const largestId = order[order.length - 1];
    act(() => {
      result.current.handleDrop(largestId, '0');
    });
    expect(result.current.matched.has(largestId)).toBe(false);
    expect(onMismatch).toHaveBeenCalledTimes(1);
  });

  it('ignores a drop with no target slot', () => {
    const onMatch = vi.fn();
    const onMismatch = vi.fn();
    const { result } = renderHook(() =>
      useOrdering(config, { onComplete: vi.fn(), onMatch, onMismatch, rng }),
    );
    act(() => {
      result.current.handleDrop(result.current.items[0].id, null);
    });
    expect(onMatch).not.toHaveBeenCalled();
    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('advances to the next round once every item in the round is matched correctly', () => {
    const { result } = renderHook(() => useOrdering(config, { onComplete: vi.fn(), rng }));
    for (let slot = 0; slot < config.itemCount; slot++) {
      const order = sortedIds(result.current.items);
      act(() => {
        result.current.handleDrop(order[0], String(slot));
      });
    }
    expect(result.current.round).toBe(1);
    expect(result.current.items).toHaveLength(3);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useOrdering(config, { onComplete, rng }));
    for (let q = 0; q < config.questions; q++) {
      for (let slot = 0; slot < config.itemCount; slot++) {
        const order = sortedIds(result.current.items);
        act(() => {
          result.current.handleDrop(order[0], String(slot));
        });
      }
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

Note on the "advances to the next round" and "marks complete" tests: each iteration always drops the *smallest remaining* item at the loop's `slot` index. Since items are removed from the tray as they're matched, the smallest remaining item's true rank always equals the number of items already placed — so `slot` (0, 1, 2, ...) correctly tracks the right answer at each step without the test needing access to the hook's internal rank mapping.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/ordering/useOrdering.test.ts`
Expected: FAIL — `Cannot find module './useOrdering'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/ordering/useOrdering.ts
import { useState } from 'react';
import { shuffle } from '../../lib/shuffle';
import { SHAPES } from '../shapes';
import { pickMagnitudes } from './pickMagnitudes';
import type { OrderingConfig } from './presets';

const MAX_MAGNITUDE = 10;

export interface Item {
  id: string;
  magnitude: number;
}

export interface UseOrderingOptions {
  onComplete: () => void;
  onMatch?: () => void;
  onMismatch?: () => void;
  rng?: () => number;
}

export interface UseOrderingResult {
  round: number;
  totalQuestions: number;
  shape: string;
  itemCount: number;
  /** Items still unmatched — i.e. still in the tray — for the current round. */
  items: Item[];
  matched: Set<string>;
  isComplete: boolean;
  /** `targetSlot` is a decimal-string slot id ("0", "1", ...), or null if the drop
   *  landed on no slot. Only a drop on the item's correct slot counts. */
  handleDrop: (itemId: string, targetSlot: string | null) => void;
}

interface RoundState {
  round: number;
  shape: string;
  items: Item[];
  rankById: Record<string, number>;
}

function pickRound(round: number, config: OrderingConfig, rng: () => number): RoundState {
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
  const magnitudes = pickMagnitudes(config.itemCount, config.minGap, MAX_MAGNITUDE, rng);
  const ids = magnitudes.map((_, i) => `item-${i}`);
  const rankById: Record<string, number> = {};
  ids.forEach((id, i) => {
    rankById[id] = i;
  });
  const items = shuffle(
    ids.map((id, i) => ({ id, magnitude: magnitudes[i] })),
    rng,
  );
  return { round, shape, items, rankById };
}

/**
 * Drives one ordering session: a sequence of `config.questions` rounds, each asking
 * the player to drag `config.itemCount` differently sized shapes into slots ordered
 * smallest to largest. A round completes once every item is dropped on its correct
 * slot; a wrong-slot drop is a no-op (no penalty, item stays in the tray).
 */
export function useOrdering(
  config: OrderingConfig,
  { onComplete, onMatch, onMismatch, rng = Math.random }: UseOrderingOptions,
): UseOrderingResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, rng));
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const handleDrop = (itemId: string, targetSlot: string | null) => {
    if (targetSlot === null) return;
    if (String(state.rankById[itemId]) !== targetSlot) {
      onMismatch?.();
      return;
    }

    onMatch?.();
    const nextMatched = new Set(matched).add(itemId);
    if (nextMatched.size < config.itemCount) {
      setMatched(nextMatched);
      return;
    }

    const nextRoundNumber = state.round + 1;
    if (nextRoundNumber >= config.questions) {
      setIsComplete(true);
      onComplete();
    } else {
      setState(pickRound(nextRoundNumber, config, rng));
      setMatched(new Set());
    }
  };

  return {
    round: state.round,
    totalQuestions: config.questions,
    shape: state.shape,
    itemCount: config.itemCount,
    items: state.items.filter((item) => !matched.has(item.id)),
    matched,
    isComplete,
    handleDrop,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/ordering/useOrdering.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/ordering/useOrdering.ts src/games/ordering/useOrdering.test.ts
git commit -m "feat: add useOrdering round-and-drag-sequencing hook"
```

---

### Task 4: `OrderingBoard` UI component

**Files:**
- Create: `src/games/ordering/OrderingBoard.tsx`

**Interfaces:**
- Consumes: `useOrdering` (Task 3), `getOrderingPreset` (Task 1), `findMatchingSlot`/`eventPoint`/`SlotRect` from `src/lib/hitTest.ts` (existing — same module Sort and Shadow Match already use), `useSound()` from `src/hooks/useSound.ts` (returns `{ playClick, playSuccess, playError }`, each `() => void`).
- Produces: `OrderingBoard` — a React component matching the shape `boards.tsx` needs (`presetId?: string`, `onComplete: () => void`; `itemIds`/`modeId` are part of `BoardProps` but unused here, same pattern `CountingBoard`/`CompareBoard`/`ArithmeticBoard` already follow).

- [ ] **Step 1: Write the implementation**

```tsx
// src/games/ordering/OrderingBoard.tsx
import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrdering } from './useOrdering';
import { getOrderingPreset } from './presets';
import { findMatchingSlot, eventPoint, type SlotRect } from '../../lib/hitTest';
import { useSound } from '../../hooks/useSound';

interface OrderingBoardProps {
  presetId?: string;
  onComplete: () => void;
}

function magnitudeFontSize(magnitude: number): string {
  // magnitude is 1..10; map linearly onto a 2rem..5rem font size (smaller ceiling
  // than the compare game's 7rem since up to 4 of these sit side by side in a tray).
  return `${2 + (magnitude - 1) * (3 / 9)}rem`;
}

export function OrderingBoard({ presetId, onComplete }: OrderingBoardProps) {
  const config = getOrderingPreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, shape, itemCount, items, handleDrop } = useOrdering(config, {
    onComplete,
    onMatch: playSuccess,
    onMismatch: playError,
  });

  const slotElements = useRef(new Map<string, HTMLDivElement>());

  const registerSlot = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) slotElements.current.set(id, el);
    else slotElements.current.delete(id);
  }, []);

  const dropOn = useCallback(
    (itemId: string, point: { x: number; y: number }) => {
      const rects: SlotRect[] = [...slotElements.current].map(([id, el]) => {
        const r = el.getBoundingClientRect();
        return { id, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      handleDrop(itemId, findMatchingSlot(point, rects));
    },
    [handleDrop],
  );

  const slotIds = Array.from({ length: itemCount }, (_, i) => String(i));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 p-4 sm:p-6">
      <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
        Câu {round + 1}/{totalQuestions}
      </span>
      <span className="text-lg font-bold text-earth">Nhỏ nhất → Lớn nhất</span>

      <div className="flex w-full items-end justify-center gap-3 sm:gap-4">
        {slotIds.map((id) => (
          <div
            key={id}
            ref={(el) => registerSlot(id, el)}
            className="flex h-24 w-20 items-center justify-center rounded-2xl border-4 border-dashed border-earth/30 bg-white/40 sm:h-28 sm:w-24"
          />
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              drag
              dragSnapToOrigin
              dragElastic={0.2}
              dragMomentum={false}
              onDragStart={playClick}
              onDragEnd={(event, info) => dropOn(item.id, eventPoint(event, info.point))}
              onContextMenu={(event) => event.preventDefault()}
              whileDrag={{ scale: 1.1, zIndex: 20 }}
              exit={{ scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ WebkitTouchCallout: 'none' }}
              className="flex h-24 w-20 cursor-grab items-center justify-center rounded-2xl bg-sunny shadow-md select-none active:cursor-grabbing sm:h-28 sm:w-24"
            >
              <span style={{ fontSize: magnitudeFontSize(item.magnitude) }}>{shape}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/games/ordering/OrderingBoard.tsx
git commit -m "feat: add OrderingBoard UI for the ordering game"
```

---

### Task 5: Registry entry, `boards.tsx` registration, and full verification

**Files:**
- Modify: `src/games/registry.ts`
- Modify: `src/games/boards.tsx`

**Interfaces:**
- Consumes: `orderingPresets` from `./ordering/presets` (Task 1); `OrderingBoard` from `./ordering/OrderingBoard` (Task 4).
- Produces: nothing new consumed by later tasks — this is the final wiring task.

- [ ] **Step 1: Add the import and registry entry to `src/games/registry.ts`**

Add alongside the existing imports:

```ts
import { orderingPresets } from './ordering/presets';
```

Append to the `games` array, after the `arithmetic` entry:

```ts
  {
    id: 'ordering',
    name: 'Sắp xếp kích thước',
    emoji: '📏',
    // Same reasoning as counting/compare/arithmetic: presets replace the numeric
    // slider, so these three fields are required by GameMeta but unused here.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: orderingPresets,
  },
```

- [ ] **Step 2: Register the board in `src/games/boards.tsx`**

Add the import:

```ts
import { OrderingBoard } from './ordering/OrderingBoard';
```

Add the entry to the `boards` record:

```ts
  ordering: OrderingBoard,
```

(so the full record reads `{ 'memory-match': MemoryMatchBoard, 'shadow-match': ShadowMatchBoard, sort: SortBoard, counting: CountingBoard, compare: CompareBoard, arithmetic: ArithmeticBoard, ordering: OrderingBoard }`)

- [ ] **Step 3: Typecheck the whole project**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all test files PASS. (If several files fail with "Failed to start threads worker" or a timeout, that's the known Node 25 + Vitest 4 environment flake in this project — re-run `npm test` once before treating it as real.)

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Manual smoke test**

Run: `npm run dev`, open the app, choose "📏 Sắp xếp kích thước" from the home menu, confirm:
- Setup screen shows no "Chủ đề" section, shows "Độ khó" with Dễ/Vừa/Khó buttons, "Chơi" is disabled until one is picked.
- Playing Dễ shows 3 shapes to drag into 3 slots; dragging the smallest shape onto the correct (leftmost) slot settles it there and removes it from the tray; dragging onto the wrong slot snaps it back to the tray with an error sound.
- Completing all slots for a round advances to the next round; after the last question the 🎉 overlay appears, and "Chơi lại" starts a fresh session.
- Playing Khó shows 4 shapes with sizes closer together (harder to tell apart) than Dễ's 3.
- The Sort and Shadow Match games (which also use drag-and-drop) still work — regression check, since this task didn't touch their files but shares `src/lib/hitTest.ts` with them.

- [ ] **Step 8: Commit**

```bash
git add src/games/registry.ts src/games/boards.tsx
git commit -m "feat: register the ordering game"
```

---

## Post-plan notes

- Largest → smallest ordering, mixed-direction sessions, and ordering by quantity are deliberately out of scope — do not fold them into this game.
- No new localStorage keys are introduced; this game has no cross-round anti-repeat state (not requested, same as compare/arithmetic).
