# Compare Game ("So sánh") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifth game, "So sánh" (⚖️), where the child compares two things — size ("to hơn"/"nhỏ hơn") or quantity ("nhiều hơn"/"ít hơn") — mixed randomly round to round, and taps the side matching the asked direction.

**Architecture:** A self-contained `src/games/compare/` module (presets data, a pure `pickOther` magnitude picker, a `useCompare` round-sequencing hook, and a `CompareBoard` component), plugged into the existing `registry.ts`/`boards.tsx`. This game needs **zero** changes to `App.tsx`, `SetupScreen.tsx`, or `GameScreen.tsx` — it reuses the `noCategories`/`presets`/`roundKey` infrastructure the counting game already added. One small shared-code cleanup rides along: the `SHAPES` emoji list currently lives only inside `useCounting.ts`; this plan extracts it to a shared module so both games use the same list instead of duplicating it.

**Tech Stack:** React 19 + TypeScript (strict), Tailwind CSS v4, Motion (`motion/react`), Vitest + `@testing-library/react`.

## Global Constraints

- No backend/database — this game is entirely computed client-side (no new localStorage keys).
- Player-facing strings in Vietnamese, matching every other game's copy.
- oxlint (not ESLint) is the linter; disable-comments (if ever needed) use `oxlint-disable-next-line <rule>` syntax placed directly above the flagged line.
- The counting game (`memory-match`, `shadow-match`, `sort`, `counting`) must keep passing its current tests and behavior unchanged.
- Length (dài/ngắn) and height (cao/thấp) comparisons are explicitly out of scope for this plan.
- Real item photos are explicitly rejected for this game (misleading for size comparison) — use simple emoji shapes only.

---

### Task 1: Extract the shared `SHAPES` list

**Files:**
- Create: `src/games/shapes.ts`
- Modify: `src/games/counting/useCounting.ts`

**Interfaces:**
- Produces: `SHAPES: string[]` (the same 6 emoji currently hardcoded in `useCounting.ts`).

- [ ] **Step 1: Create the shared module**

```ts
// src/games/shapes.ts
/** Simple, unambiguous emoji shapes shared by games that don't use item photos
 *  (counting, compare) — deliberately generic so a shape carries no category
 *  meaning of its own; only its size/count matters for those games. */
export const SHAPES = ['⭐', '🔴', '❤️', '🌸', '🔵', '🟢'];
```

- [ ] **Step 2: Update `useCounting.ts` to import it instead of declaring its own copy**

In `src/games/counting/useCounting.ts`, replace:

```ts
const SHAPES = ['⭐', '🔴', '❤️', '🌸', '🔵', '🟢'];
```

with:

```ts
import { SHAPES } from '../shapes';
```

(Add this import alongside the existing `import { pickChoices } from './pickChoices';` line; remove the old `const SHAPES = [...]` line entirely.)

- [ ] **Step 3: Run the counting game's existing tests to confirm no regression**

Run: `npx vitest run src/games/counting/useCounting.test.ts`
Expected: PASS (5 tests) — same as before, since the list's contents are unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/games/shapes.ts src/games/counting/useCounting.ts
git commit -m "refactor: extract shared SHAPES list out of useCounting"
```

---

### Task 2: Compare presets data

**Files:**
- Create: `src/games/compare/presets.ts`
- Test: `src/games/compare/presets.test.ts`

**Interfaces:**
- Produces: `CompareConfig { questions: number; minGap: number }`, `ComparePreset { id: string; name: string; config: CompareConfig }`, `comparePresets: ComparePreset[]`, `getComparePreset(id: string): CompareConfig` (throws `Error` on unknown id).

- [ ] **Step 1: Write the failing test**

```ts
// src/games/compare/presets.test.ts
import { describe, it, expect } from 'vitest';
import { comparePresets, getComparePreset } from './presets';

describe('comparePresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(comparePresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('decreases minGap and increases questions from easy to hard', () => {
    const [easy, medium, hard] = comparePresets;
    expect(easy.config.minGap).toBeGreaterThan(medium.config.minGap);
    expect(medium.config.minGap).toBeGreaterThan(hard.config.minGap);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getComparePreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getComparePreset('easy')).toEqual({ questions: 5, minGap: 4 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getComparePreset('nope')).toThrow('Unknown compare preset: nope');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/compare/presets.test.ts`
Expected: FAIL — `Cannot find module './presets'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/compare/presets.ts
export interface CompareConfig {
  /** How many rounds make up one session. */
  questions: number;
  /** Minimum gap between the two rounds' magnitudes, in [1, 10] — a smaller gap
   *  makes the two options look more alike, which is harder to tell apart. */
  minGap: number;
}

export interface ComparePreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: CompareConfig;
}

export const comparePresets: ComparePreset[] = [
  { id: 'easy', name: 'Dễ', config: { questions: 5, minGap: 4 } },
  { id: 'medium', name: 'Vừa', config: { questions: 7, minGap: 2 } },
  { id: 'hard', name: 'Khó', config: { questions: 8, minGap: 1 } },
];

export function getComparePreset(id: string): CompareConfig {
  const preset = comparePresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown compare preset: ${id}`);
  return preset.config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/compare/presets.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/compare/presets.ts src/games/compare/presets.test.ts
git commit -m "feat: add compare game difficulty presets"
```

---

### Task 3: Magnitude picker (`pickOther`)

**Files:**
- Create: `src/games/compare/pickOther.ts`
- Test: `src/games/compare/pickOther.test.ts`

**Interfaces:**
- Produces: `pickOther(a: number, minGap: number, max: number, rng?: () => number): number` — returns a value in `[1, max]` that is always at least `minGap` away from `a`. Assumes a valid value always exists for the given `(minGap, max)` pair — true for every compare preset's `minGap` (4, 2, or 1) against `max = 10`, since `10 - 2*minGap + 1 >= 1` for all three.

- [ ] **Step 1: Write the failing test**

```ts
// src/games/compare/pickOther.test.ts
import { describe, it, expect } from 'vitest';
import { pickOther } from './pickOther';

describe('pickOther', () => {
  it('returns a value within [1, max] for every starting value', () => {
    for (let a = 1; a <= 10; a++) {
      const b = pickOther(a, 4, 10, () => 0.5);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it('is always at least minGap away from a', () => {
    for (let a = 1; a <= 10; a++) {
      const b = pickOther(a, 4, 10, () => 0.5);
      expect(Math.abs(a - b)).toBeGreaterThanOrEqual(4);
    }
  });

  it('works at the low and high boundary values of a with a small minGap', () => {
    expect(Math.abs(1 - pickOther(1, 1, 10, () => 0))).toBeGreaterThanOrEqual(1);
    expect(Math.abs(10 - pickOther(10, 1, 10, () => 0.999))).toBeGreaterThanOrEqual(1);
  });

  it('varies with rng across its full [0, 1) domain', () => {
    const low = pickOther(5, 1, 10, () => 0);
    const high = pickOther(5, 1, 10, () => 0.999);
    expect(low).not.toBe(high);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/compare/pickOther.test.ts`
Expected: FAIL — `Cannot find module './pickOther'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/compare/pickOther.ts
/**
 * Returns a value in [1, max] that's at least `minGap` away from `a`, without a
 * rejection-sampling loop (a fixed/degenerate rng would otherwise loop forever) —
 * maps rng's output directly onto the valid values below and above `a`. Assumes a
 * valid value always exists for the configured (minGap, max) — true for every
 * compare preset's minGap (4, 2, or 1) against max = 10.
 */
export function pickOther(
  a: number,
  minGap: number,
  max: number,
  rng: () => number = Math.random,
): number {
  const belowCount = Math.max(0, a - minGap);
  const aboveCount = Math.max(0, max - (a + minGap) + 1);
  const total = belowCount + aboveCount;
  const r = Math.floor(rng() * total);
  return r < belowCount ? 1 + r : a + minGap + (r - belowCount);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/compare/pickOther.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/compare/pickOther.ts src/games/compare/pickOther.test.ts
git commit -m "feat: add pickOther magnitude picker for the compare game"
```

---

### Task 4: Round-sequencing hook (`useCompare`)

**Files:**
- Create: `src/games/compare/useCompare.ts`
- Test: `src/games/compare/useCompare.test.ts`

**Interfaces:**
- Consumes: `CompareConfig` from `./presets` (Task 2); `pickOther` from `./pickOther` (Task 3); `SHAPES` from `../shapes` (Task 1).
- Produces: `useCompare(config: CompareConfig, options: { onComplete: () => void; rng?: () => number }): { round: number; totalQuestions: number; type: 'size' | 'quantity'; wantGreater: boolean; shape: string; left: number; right: number; isComplete: boolean; submitAnswer: (side: 'left' | 'right') => boolean }`. `submitAnswer` returns `true` and advances the round (or completes) only when `side` is the correct one; otherwise returns `false` and the round does not advance.

- [ ] **Step 1: Write the failing test**

```ts
// src/games/compare/useCompare.test.ts
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCompare } from './useCompare';

const config = { questions: 3, minGap: 4 };
const rng = () => 0.5;

function correctSideFor(result: { left: number; right: number; wantGreater: boolean }) {
  return result.left > result.right === result.wantGreater ? 'left' : 'right';
}

describe('useCompare', () => {
  it('starts at round 0 with two magnitudes at least minGap apart', () => {
    const { result } = renderHook(() => useCompare(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(Math.abs(result.current.left - result.current.right)).toBeGreaterThanOrEqual(4);
  });

  it('advances to the next round when the correct side is tapped', () => {
    const { result } = renderHook(() => useCompare(config, { onComplete: vi.fn(), rng }));
    const correctSide = correctSideFor(result.current);
    act(() => {
      expect(result.current.submitAnswer(correctSide)).toBe(true);
    });
    expect(result.current.round).toBe(1);
  });

  it('does not advance when the wrong side is tapped', () => {
    const { result } = renderHook(() => useCompare(config, { onComplete: vi.fn(), rng }));
    const wrongSide = correctSideFor(result.current) === 'left' ? 'right' : 'left';
    act(() => {
      expect(result.current.submitAnswer(wrongSide)).toBe(false);
    });
    expect(result.current.round).toBe(0);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCompare(config, { onComplete, rng }));
    for (let i = 0; i < config.questions; i++) {
      const correctSide = correctSideFor(result.current);
      act(() => {
        result.current.submitAnswer(correctSide);
      });
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/compare/useCompare.test.ts`
Expected: FAIL — `Cannot find module './useCompare'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/compare/useCompare.ts
import { useState } from 'react';
import { SHAPES } from '../shapes';
import { pickOther } from './pickOther';
import type { CompareConfig } from './presets';

const MAX_MAGNITUDE = 10;

export interface UseCompareOptions {
  onComplete: () => void;
  rng?: () => number;
}

export interface UseCompareResult {
  round: number;
  totalQuestions: number;
  type: 'size' | 'quantity';
  wantGreater: boolean;
  shape: string;
  left: number;
  right: number;
  isComplete: boolean;
  /** Returns true and advances the round only when `side` is the correct one. */
  submitAnswer: (side: 'left' | 'right') => boolean;
}

interface RoundState {
  round: number;
  type: 'size' | 'quantity';
  wantGreater: boolean;
  shape: string;
  left: number;
  right: number;
  correctSide: 'left' | 'right';
}

function pickRound(round: number, config: CompareConfig, rng: () => number): RoundState {
  const type: 'size' | 'quantity' = rng() < 0.5 ? 'size' : 'quantity';
  const wantGreater = rng() < 0.5;
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
  const a = 1 + Math.floor(rng() * MAX_MAGNITUDE);
  const b = pickOther(a, config.minGap, MAX_MAGNITUDE, rng);
  const swap = rng() < 0.5;
  const left = swap ? b : a;
  const right = swap ? a : b;
  const correctSide: 'left' | 'right' = wantGreater === left > right ? 'left' : 'right';
  return { round, type, wantGreater, shape, left, right, correctSide };
}

/**
 * Drives one compare session: a sequence of `config.questions` rounds, each asking
 * the player to pick the side matching a randomly chosen comparison ("to hơn" /
 * "nhỏ hơn" / "nhiều hơn" / "ít hơn"). Advances only on a correct tap; a wrong tap
 * doesn't move the round forward (no penalty).
 */
export function useCompare(
  config: CompareConfig,
  { onComplete, rng = Math.random }: UseCompareOptions,
): UseCompareResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, rng));
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = (side: 'left' | 'right'): boolean => {
    if (isComplete || side !== state.correctSide) return false;

    const nextRoundNumber = state.round + 1;
    if (nextRoundNumber >= config.questions) {
      setIsComplete(true);
      onComplete();
    } else {
      setState(pickRound(nextRoundNumber, config, rng));
    }
    return true;
  };

  return {
    round: state.round,
    totalQuestions: config.questions,
    type: state.type,
    wantGreater: state.wantGreater,
    shape: state.shape,
    left: state.left,
    right: state.right,
    isComplete,
    submitAnswer,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/compare/useCompare.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/compare/useCompare.ts src/games/compare/useCompare.test.ts
git commit -m "feat: add useCompare round-sequencing hook"
```

---

### Task 5: `CompareBoard` UI component

**Files:**
- Create: `src/games/compare/CompareBoard.tsx`

**Interfaces:**
- Consumes: `useCompare` (Task 4), `getComparePreset` (Task 2), `useSound()` from `src/hooks/useSound.ts` (returns `{ playClick, playSuccess, playError }`, each `() => void`).
- Produces: `CompareBoard` — a React component matching the shape `boards.tsx` needs (`presetId?: string`, `onComplete: () => void`; `itemIds`/`modeId` are part of `BoardProps` but unused here, same pattern `CountingBoard` already follows).

- [ ] **Step 1: Write the implementation**

```tsx
// src/games/compare/CompareBoard.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { useCompare } from './useCompare';
import { getComparePreset } from './presets';
import { useSound } from '../../hooks/useSound';

interface CompareBoardProps {
  presetId?: string;
  onComplete: () => void;
}

function questionLabel(type: 'size' | 'quantity', wantGreater: boolean): string {
  if (type === 'size') return wantGreater ? 'To hơn' : 'Nhỏ hơn';
  return wantGreater ? 'Nhiều hơn' : 'Ít hơn';
}

interface SideContentProps {
  type: 'size' | 'quantity';
  shape: string;
  magnitude: number;
}

function SideContent({ type, shape, magnitude }: SideContentProps) {
  if (type === 'size') {
    // magnitude is 1..10; map linearly onto a 2rem..7rem font size.
    const fontSize = 2 + (magnitude - 1) * (5 / 9);
    return <span style={{ fontSize: `${fontSize}rem` }}>{shape}</span>;
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(2rem,2.5rem))] justify-center gap-1">
      {Array.from({ length: magnitude }, (_, i) => (
        <span key={i} className="text-2xl">
          {shape}
        </span>
      ))}
    </div>
  );
}

export function CompareBoard({ presetId, onComplete }: CompareBoardProps) {
  const config = getComparePreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, type, wantGreater, shape, left, right, submitAnswer } =
    useCompare(config, { onComplete });
  const [wrongSide, setWrongSide] = useState<'left' | 'right' | null>(null);

  const handlePick = (side: 'left' | 'right') => {
    playClick();
    if (submitAnswer(side)) {
      playSuccess();
      setWrongSide(null);
    } else {
      playError();
      setWrongSide(side);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 p-4 sm:p-6">
      <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
        Câu {round + 1}/{totalQuestions}
      </span>
      <h2 className="text-2xl font-extrabold text-earth drop-shadow">
        {questionLabel(type, wantGreater)}
      </h2>

      <div className="flex w-full items-center justify-center gap-6">
        {(['left', 'right'] as const).map((side) => (
          <motion.button
            key={side}
            type="button"
            onClick={() => handlePick(side)}
            whileTap={{ scale: 0.95 }}
            animate={wrongSide === side ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-40 w-40 flex-1 items-center justify-center rounded-3xl bg-sunny shadow-lg sm:h-48 sm:w-48"
          >
            <SideContent type={type} shape={shape} magnitude={side === 'left' ? left : right} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/games/compare/CompareBoard.tsx
git commit -m "feat: add CompareBoard UI for the compare game"
```

---

### Task 6: Registry entry, `boards.tsx` registration, and full verification

**Files:**
- Modify: `src/games/registry.ts`
- Modify: `src/games/boards.tsx`

**Interfaces:**
- Consumes: `comparePresets` from `./compare/presets` (Task 2); `CompareBoard` from `./compare/CompareBoard` (Task 5).
- Produces: nothing new consumed by later tasks — this is the final wiring task.

- [ ] **Step 1: Add the import and registry entry to `src/games/registry.ts`**

Add alongside the existing imports:

```ts
import { comparePresets } from './compare/presets';
```

Append to the `games` array, after the `counting` entry:

```ts
  {
    id: 'compare',
    name: 'So sánh',
    emoji: '⚖️',
    // Same reasoning as the counting game: presets replace the numeric slider, so
    // these three fields are required by GameMeta but unused here.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: comparePresets,
  },
```

- [ ] **Step 2: Register the board in `src/games/boards.tsx`**

Add the import:

```ts
import { CompareBoard } from './compare/CompareBoard';
```

Add the entry to the `boards` record:

```ts
  compare: CompareBoard,
```

(so the full record reads `{ 'memory-match': MemoryMatchBoard, 'shadow-match': ShadowMatchBoard, sort: SortBoard, counting: CountingBoard, compare: CompareBoard }`)

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

Run: `npm run dev`, open the app, choose "⚖️ So sánh" from the home menu, confirm:
- Setup screen shows no "Chủ đề" section, shows "Độ khó" with Dễ/Vừa/Khó buttons, "Chơi" is disabled until one is picked.
- Playing any preset shows a mix of "To hơn"/"Nhỏ hơn"/"Nhiều hơn"/"Ít hơn" prompts across rounds (not always the same one).
- Tapping the correct side advances; tapping the wrong side shakes that card and doesn't advance or crash.
- After the last question the 🎉 overlay appears, and "Chơi lại" starts a fresh session (regression check for the counting game's `roundKey` fix — this game also always has `itemIds: []`).
- The counting game (🔢 Đếm số lượng) still works after the `SHAPES` extraction in Task 1.

- [ ] **Step 8: Commit**

```bash
git add src/games/registry.ts src/games/boards.tsx
git commit -m "feat: register the compare game"
```

---

## Post-plan notes

- Length (dài/ngắn) and height (cao/thấp) comparisons are a deliberately separate, later addition — do not fold them into this game's scope.
- No new localStorage keys are introduced; this game has no cross-round anti-repeat state at all (unlike counting, which avoids repeating the immediately previous quantity — not requested for this game).
