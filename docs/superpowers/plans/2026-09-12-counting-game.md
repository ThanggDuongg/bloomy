# Counting Game ("Đếm số lượng") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth game, "Đếm số lượng" (Counting), where the child counts a group of identical shapes and taps the matching number, in a session of several rounds sized by a Dễ/Vừa/Khó preset.

**Architecture:** A self-contained `src/games/counting/` module (presets data, pure answer-choice picker, a `useCounting` round-sequencing hook, and a `CountingBoard` component) plugs into the existing multi-game infrastructure (`registry.ts`, `SetupScreen.tsx`, `App.tsx`, `boards.tsx`, `GameScreen.tsx`) through two small new `GameMeta` capabilities: `noCategories` (skip the topic-picker section in Setup) and `presets` (a fixed named-preset picker instead of the numeric difficulty slider). This game has no "board of items drawn from `src/data`" like every other game — each round generates its own random quantity/shape on the fly — so it doesn't touch `src/data` at all.

**Tech Stack:** React 19 + TypeScript (strict), Tailwind CSS v4, Motion (`motion/react`), Vitest + `@testing-library/react`.

## Global Constraints

- No backend/database — this game is entirely computed client-side (no new localStorage keys needed).
- Follow existing Vietnamese-first UI text conventions (all player-facing strings in Vietnamese, matching other games' Setup/Board copy).
- oxlint (not ESLint) is the linter; disable-comments (if ever needed) use `oxlint-disable-next-line <rule>` syntax placed directly above the flagged line.
- Every existing game (`memory-match`, `shadow-match`, `sort`) must keep passing its current tests and behavior unchanged — new `GameMeta`/`BoardProps`/`GameScreenProps` fields must be optional and additive.
- Addition/subtraction is explicitly out of scope for this plan (future, separate feature).

---

### Task 1: Counting presets data

**Files:**
- Create: `src/games/counting/presets.ts`
- Test: `src/games/counting/presets.test.ts`

**Interfaces:**
- Produces: `CountingConfig { maxNumber: number; questions: number }`, `CountingPreset { id: string; name: string; config: CountingConfig }`, `countingPresets: CountingPreset[]`, `getCountingPreset(id: string): CountingConfig` (throws `Error` on unknown id).

- [ ] **Step 1: Write the failing test**

```ts
// src/games/counting/presets.test.ts
import { describe, it, expect } from 'vitest';
import { countingPresets, getCountingPreset } from './presets';

describe('countingPresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(countingPresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('increases maxNumber and questions from easy to hard', () => {
    const [easy, medium, hard] = countingPresets;
    expect(easy.config.maxNumber).toBeLessThan(medium.config.maxNumber);
    expect(medium.config.maxNumber).toBeLessThan(hard.config.maxNumber);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getCountingPreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getCountingPreset('easy')).toEqual({ maxNumber: 5, questions: 5 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getCountingPreset('nope')).toThrow('Unknown counting preset: nope');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/counting/presets.test.ts`
Expected: FAIL — `Cannot find module './presets'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// src/games/counting/presets.ts
export interface CountingConfig {
  /** Count up to this number (inclusive), e.g. 5. */
  maxNumber: number;
  /** How many rounds make up one session. */
  questions: number;
}

export interface CountingPreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: CountingConfig;
}

export const countingPresets: CountingPreset[] = [
  { id: 'easy', name: 'Dễ', config: { maxNumber: 5, questions: 5 } },
  { id: 'medium', name: 'Vừa', config: { maxNumber: 8, questions: 7 } },
  { id: 'hard', name: 'Khó', config: { maxNumber: 10, questions: 8 } },
];

export function getCountingPreset(id: string): CountingConfig {
  const preset = countingPresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown counting preset: ${id}`);
  return preset.config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/counting/presets.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/counting/presets.ts src/games/counting/presets.test.ts
git commit -m "feat: add counting game difficulty presets"
```

---

### Task 2: Answer-choice picker (`pickChoices`)

**Files:**
- Create: `src/games/counting/pickChoices.ts`
- Test: `src/games/counting/pickChoices.test.ts`

**Interfaces:**
- Consumes: `shuffle` from `src/lib/shuffle.ts` — `shuffle<T>(input: readonly T[], rng?: () => number): T[]`.
- Produces: `pickChoices(correct: number, max: number, rng?: () => number): number[]` — always returns 4 distinct numbers in `[1, max]` including `correct`. Assumes `max >= 4` (guaranteed by every preset in Task 1: `maxNumber` is 5, 8, or 10).

- [ ] **Step 1: Write the failing test**

```ts
// src/games/counting/pickChoices.test.ts
import { describe, it, expect } from 'vitest';
import { pickChoices } from './pickChoices';

describe('pickChoices', () => {
  it('always includes the correct answer', () => {
    const choices = pickChoices(3, 10, () => 0.5);
    expect(choices).toContain(3);
  });

  it('returns 4 distinct numbers within [1, max]', () => {
    const choices = pickChoices(3, 10, () => 0.5);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    for (const n of choices) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('prefers decoys close to the correct answer', () => {
    const choices = pickChoices(5, 10, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([3, 4, 5, 6]));
  });

  it('still returns 4 distinct numbers near the low edge of the range', () => {
    const choices = pickChoices(1, 5, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([1, 2, 3, 4]));
  });

  it('still returns 4 distinct numbers near the high edge of the range', () => {
    const choices = pickChoices(10, 10, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([7, 8, 9, 10]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/counting/pickChoices.test.ts`
Expected: FAIL — `Cannot find module './pickChoices'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/counting/pickChoices.ts
import { shuffle } from '../../lib/shuffle';

/**
 * Returns 4 shuffled distinct numbers within [1, max] that always include `correct`,
 * preferring numbers close to `correct` as decoys (a far-off wrong answer is too easy
 * to rule out on sight, which defeats the point of counting practice). Assumes
 * max >= 4 — guaranteed by every counting preset's maxNumber (5, 8, or 10).
 */
export function pickChoices(
  correct: number,
  max: number,
  rng: () => number = Math.random,
): number[] {
  const decoys: number[] = [];
  for (let distance = 1; decoys.length < 3 && distance < max; distance++) {
    for (const candidate of [correct - distance, correct + distance]) {
      if (decoys.length >= 3) break;
      if (candidate >= 1 && candidate <= max && candidate !== correct) {
        decoys.push(candidate);
      }
    }
  }
  return shuffle([correct, ...decoys], rng);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/counting/pickChoices.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/counting/pickChoices.ts src/games/counting/pickChoices.test.ts
git commit -m "feat: add pickChoices for the counting game's answer options"
```

---

### Task 3: Round-sequencing hook (`useCounting`)

**Files:**
- Create: `src/games/counting/useCounting.ts`
- Test: `src/games/counting/useCounting.test.ts`

**Interfaces:**
- Consumes: `CountingConfig` from `./presets` (Task 1); `pickChoices` from `./pickChoices` (Task 2).
- Produces: `useCounting(config: CountingConfig, options: { onComplete: () => void; rng?: () => number }): { round: number; totalQuestions: number; quantity: number; shape: string; choices: number[]; isComplete: boolean; submitAnswer: (value: number) => boolean }`. `round` is 0-indexed. `submitAnswer` returns `true` and advances to the next round (or completes) only on a correct guess; on a wrong guess it returns `false` and the round does not advance.

- [ ] **Step 1: Write the failing test**

```ts
// src/games/counting/useCounting.test.ts
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCounting } from './useCounting';

const config = { maxNumber: 5, questions: 3 };
const rng = () => 0.5;

describe('useCounting', () => {
  it('starts at round 0 with a quantity and matching choices', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.quantity).toBeGreaterThanOrEqual(1);
    expect(result.current.quantity).toBeLessThanOrEqual(5);
    expect(result.current.choices).toContain(result.current.quantity);
  });

  it('advances to the next round on a correct answer', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    const correct = result.current.quantity;
    act(() => {
      expect(result.current.submitAnswer(correct)).toBe(true);
    });
    expect(result.current.round).toBe(1);
  });

  it('does not advance on a wrong answer', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    const wrong = result.current.choices.find((c) => c !== result.current.quantity)!;
    act(() => {
      expect(result.current.submitAnswer(wrong)).toBe(false);
    });
    expect(result.current.round).toBe(0);
  });

  it('never repeats the immediately previous quantity', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    const first = result.current.quantity;
    act(() => {
      result.current.submitAnswer(first);
    });
    expect(result.current.quantity).not.toBe(first);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCounting(config, { onComplete, rng }));
    for (let i = 0; i < config.questions; i++) {
      act(() => {
        result.current.submitAnswer(result.current.quantity);
      });
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/counting/useCounting.test.ts`
Expected: FAIL — `Cannot find module './useCounting'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/counting/useCounting.ts
import { useState } from 'react';
import { pickChoices } from './pickChoices';
import type { CountingConfig } from './presets';

const SHAPES = ['⭐', '🔴', '❤️', '🌸', '🔵', '🟢'];

export interface UseCountingOptions {
  onComplete: () => void;
  rng?: () => number;
}

export interface UseCountingResult {
  round: number;
  totalQuestions: number;
  quantity: number;
  shape: string;
  choices: number[];
  isComplete: boolean;
  /** Returns true and advances the round only on a correct guess. */
  submitAnswer: (value: number) => boolean;
}

interface RoundState {
  round: number;
  quantity: number;
  shape: string;
  choices: number[];
}

/**
 * Picks a number in [1, max] that's never equal to `previous`, without a
 * rejection-sampling loop (a fixed/degenerate rng would otherwise loop forever) —
 * maps rng's output directly onto the max-1 values other than `previous`. Assumes
 * max >= 2, guaranteed by every counting preset's maxNumber (5, 8, or 10).
 */
function pickQuantity(max: number, previous: number | null, rng: () => number): number {
  if (previous === null) return 1 + Math.floor(rng() * max);
  const candidate = 1 + Math.floor(rng() * (max - 1));
  return candidate < previous ? candidate : candidate + 1;
}

function pickRound(
  round: number,
  config: CountingConfig,
  previousQuantity: number | null,
  rng: () => number,
): RoundState {
  const quantity = pickQuantity(config.maxNumber, previousQuantity, rng);
  return {
    round,
    quantity,
    shape: SHAPES[Math.floor(rng() * SHAPES.length)],
    choices: pickChoices(quantity, config.maxNumber, rng),
  };
}

/**
 * Drives one counting session: a sequence of `config.questions` rounds, each asking
 * the player to pick the number matching how many shapes are shown. Advances only on
 * a correct answer; a wrong tap doesn't move the round forward (no penalty).
 */
export function useCounting(
  config: CountingConfig,
  { onComplete, rng = Math.random }: UseCountingOptions,
): UseCountingResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, null, rng));
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = (value: number): boolean => {
    if (isComplete || value !== state.quantity) return false;

    const nextRoundNumber = state.round + 1;
    if (nextRoundNumber >= config.questions) {
      setIsComplete(true);
      onComplete();
    } else {
      setState(pickRound(nextRoundNumber, config, state.quantity, rng));
    }
    return true;
  };

  return {
    round: state.round,
    totalQuestions: config.questions,
    quantity: state.quantity,
    shape: state.shape,
    choices: state.choices,
    isComplete,
    submitAnswer,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/counting/useCounting.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/counting/useCounting.ts src/games/counting/useCounting.test.ts
git commit -m "feat: add useCounting round-sequencing hook"
```

---

### Task 4: `GameMeta` capabilities + counting registry entry

**Files:**
- Modify: `src/games/registry.ts`

**Interfaces:**
- Consumes: `countingPresets` from `./counting/presets` (Task 1).
- Produces: `GameMeta.noCategories?: boolean`, `GameMeta.presets?: { id: string; name: string; config: unknown }[]` (new optional fields, additive — every existing `GameMeta` object literal in `games` remains valid without changes). A new entry `{ id: 'counting', ... }` in the `games` array.

- [ ] **Step 1: Add the import**

In `src/games/registry.ts`, add alongside the existing imports:

```ts
import { countingPresets } from './counting/presets';
```

- [ ] **Step 2: Add the two new optional fields to `GameMeta`**

Insert after the existing `singleCategory?: boolean;` field (before the closing `}` of the interface):

```ts
  /**
   * When true, Setup skips the "Chủ đề" category section entirely — this game
   * doesn't draw from fruit/animal/color data (e.g. it generates its own content).
   */
  noCategories?: boolean;
  /**
   * Fixed named difficulty presets (e.g. Dễ/Vừa/Khó) shown as buttons instead of the
   * numeric DifficultySelector slider — for games where difficulty isn't a single
   * linear quantity. `config` is opaque here; each game reads its own preset config
   * directly from its own module by id (see games/counting/presets.ts).
   */
  presets?: { id: string; name: string; config: unknown }[];
```

- [ ] **Step 3: Add the counting game entry**

Append to the `games` array, after the `sort` entry:

```ts
  {
    id: 'counting',
    name: 'Đếm số lượng',
    emoji: '🔢',
    // Difficulty here sets two coupled values (max number + question count) via
    // `presets` below, not a single linear count — these three fields are still
    // required by GameMeta but unused for this game.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: countingPresets,
  },
```

- [ ] **Step 4: Verify the project still typechecks**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/games/registry.ts
git commit -m "feat: register the counting game"
```

---

### Task 5: `SetupScreen` — skip categories, preset picker, `presetId` passthrough

**Files:**
- Modify: `src/screens/SetupScreen.tsx`

**Interfaces:**
- Consumes: `GameMeta.noCategories`, `GameMeta.presets` (Task 4).
- Produces: `SetupScreenProps.onStart` signature widened to `(categoryIds: string[], count: number, modeId?: string, presetId?: string) => void` (additive 4th param — callers that only used 3 params still compile since it's optional... **note:** the actual caller is `App.tsx`'s `startRound`, updated in Task 6 to accept it; this task only changes the type and JSX, so `npx tsc -b` will show a mismatch until Task 6 lands — that's expected and resolved in the very next task).

- [ ] **Step 1: Replace the whole file**

```tsx
// src/screens/SetupScreen.tsx
import { useState } from 'react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { DifficultySelector } from '../components/DifficultySelector';
import { categoryList } from '../data';
import { availableSortModes } from '../games/sort/modes';
import type { GameMeta } from '../games/registry';

interface SetupScreenProps {
  game: GameMeta;
  onStart: (categoryIds: string[], count: number, modeId?: string, presetId?: string) => void;
  onBack: () => void;
}

export function SetupScreen({ game, onStart, onBack }: SetupScreenProps) {
  const allowed = game.allowedCategories;
  const availableCategories = allowed
    ? categoryList.filter((c) => allowed.includes(c.id))
    : categoryList;

  const [selected, setSelected] = useState<string[]>([availableCategories[0].id]);
  const [count, setCount] = useState(game.defaultCount);
  const [presetId, setPresetId] = useState<string | null>(game.presets?.[0]?.id ?? null);

  const modes = game.sortModes;
  const validModes = modes ? availableSortModes(selected) : [];
  // Remembers the user's last explicit mode click. If the category selection later
  // makes that choice invalid (e.g. deselecting "Động vật" while "Nơi sống" was
  // picked), `modeId` below falls back to the first still-valid mode — computed
  // directly during render, no effect/setState round-trip needed.
  const [modePreference, setModePreference] = useState<string | null>(
    modes ? (validModes[0]?.id ?? null) : null,
  );
  const modeId = modes
    ? (validModes.find((m) => m.id === modePreference)?.id ?? (validModes[0]?.id ?? null))
    : null;

  const toggle = (id: string) => {
    if (game.singleCategory) {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canStart =
    (game.noCategories || selected.length > 0) &&
    (!modes || modeId !== null) &&
    (!game.presets || presetId !== null);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <AnimatedBackground />
      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-4 rounded-xl bg-white/80 px-4 py-2 font-bold text-earth shadow"
      >
        ← Trang chủ
      </button>

      <h1 className="text-4xl font-extrabold text-earth drop-shadow">
        {game.emoji} {game.name}
      </h1>

      {!game.noCategories && (
        <section className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-earth drop-shadow">Chủ đề</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {availableCategories.map((category) => {
              const on = selected.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggle(category.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold text-earth shadow transition-transform active:scale-95 ${
                    on ? 'bg-peach ring-2 ring-flower' : 'bg-white/80'
                  }`}
                >
                  <span className="text-2xl">{category.emoji}</span>
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {modes && (
        <section className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-earth drop-shadow">Chế độ</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {validModes.map((mode) => {
              const on = modeId === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setModePreference(mode.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold text-earth shadow transition-transform active:scale-95 ${
                    on ? 'bg-peach ring-2 ring-flower' : 'bg-white/80'
                  }`}
                >
                  <span className="text-2xl">{mode.emoji}</span>
                  {mode.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {game.presets ? (
        <section className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-earth drop-shadow">Độ khó</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {game.presets.map((preset) => {
              const on = presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPresetId(preset.id)}
                  aria-pressed={on}
                  className={`rounded-2xl px-5 py-3 text-lg font-bold text-earth shadow transition-transform active:scale-95 ${
                    on ? 'bg-peach ring-2 ring-flower' : 'bg-white/80'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <DifficultySelector
          value={count}
          onChange={setCount}
          min={game.minCount}
          max={game.maxCount}
          unitLabel={game.unitLabel}
        />
      )}

      <button
        type="button"
        onClick={() => onStart(selected, count, modeId ?? undefined, presetId ?? undefined)}
        disabled={!canStart}
        className="rounded-full bg-flower px-10 py-4 text-2xl font-extrabold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Chơi
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

(Task 6 fixes the resulting `App.tsx` type mismatch — commit now so each task stays a focused, reviewable diff.)

```bash
git add src/screens/SetupScreen.tsx
git commit -m "feat: SetupScreen supports noCategories and fixed difficulty presets"
```

---

### Task 6: `App.tsx` + `GameScreen.tsx` + `boards.tsx` wiring

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/screens/GameScreen.tsx`
- Modify: `src/games/boards.tsx`

**Interfaces:**
- Consumes: `SetupScreenProps.onStart` 4-arg signature (Task 5); `CountingBoard` from `./counting/CountingBoard` (Task 7 — imported here first, created next task; **do this task after Task 7** if executing strictly in order, or stub the import path knowing Task 7 fills it in immediately after. This plan lists Task 7 next specifically so the import resolves by the time you run the build.).
- Produces: `BoardProps.presetId?: string`; `GameScreenProps.presetId?: string`; `GameScreenProps.roundKey: number` (replaces the old itemIds-derived remount key — see Step 2 rationale).

- [ ] **Step 1: Update `src/App.tsx`**

Replace the whole file:

```tsx
// src/App.tsx
import { useCallback, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { getCategory } from './data';
import { getGame } from './games/registry';
import { getSortMode, type SortMode } from './games/sort/modes';
import { drawFromBag, loadBag, saveBag } from './lib/bag';
import { shuffle } from './lib/shuffle';

interface Round {
  categories: string[];
  itemIds: string[];
  modeId?: string;
  presetId?: string;
}

/**
 * If `mode.maxBaskets` is set and the pool spans more distinct baskets than that,
 * keeps only a random subset of `maxBaskets` baskets' worth of items — otherwise a
 * "sort by color" round could show up to 11 drawers at once, overwhelming for a
 * toddler. Returns the pool unchanged when no cap applies or is already satisfied.
 */
function capBaskets(pool: string[], mode: SortMode | undefined): string[] {
  if (!mode?.maxBaskets) return pool;
  const allBaskets = [...new Set(pool.map(mode.basketOf))];
  if (allBaskets.length <= mode.maxBaskets) return pool;
  const chosen = new Set(shuffle(allBaskets).slice(0, mode.maxBaskets));
  return pool.filter((id) => chosen.has(mode.basketOf(id)));
}

/** Draws `count` item ids from the union of the selected categories, avoiding repeats. */
function drawItems(
  categoryIds: string[],
  count: number,
  itemPool?: readonly string[],
  groupOf?: (id: string) => string,
  mode?: SortMode,
): string[] {
  let pool = categoryIds.flatMap((c) => getCategory(c).map((i) => i.id));
  if (itemPool) {
    const allowed = new Set(itemPool);
    pool = pool.filter((id) => allowed.has(id));
  }

  const uncapped = pool;
  pool = capBaskets(pool, mode);
  // Once the basket subset is randomly narrowed, the persisted "bag" (which
  // remembers ids from the FULL pool between rounds) can no longer be trusted to
  // only contain ids from this round's narrower pool — fall back to a plain
  // shuffle for that case instead of the cross-round anti-repeat bag.
  if (pool !== uncapped) {
    return shuffle(pool).slice(0, count);
  }

  const key = `bloomy:bag:${[...categoryIds].sort((a, b) => a.localeCompare(b)).join('+')}${itemPool ? ':restricted' : ''}`;
  const { drawn, state } = drawFromBag(pool, count, loadBag(key), Math.random, groupOf);
  saveBag(key, state);
  return drawn;
}

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  // Bumped on every startRound call so GameScreen can force-remount the board even
  // when itemIds/presetId happen to be identical to the previous round (e.g. the
  // counting game never draws items at all — its itemIds is always []).
  const [roundSeq, setRoundSeq] = useState(0);

  const startRound = useCallback(
    (categoryIds: string[], count: number, modeId?: string, presetId?: string) => {
      const game = gameId ? getGame(gameId) : undefined;
      const mode = modeId ? getSortMode(modeId) : undefined;
      // A sort mode's item pool (e.g. only items with a tagged habitat/color) takes
      // over from the game-level pool, since it depends on which mode was chosen.
      const itemPool = mode?.itemPool ?? game?.itemPool;
      // Games with no category step (e.g. counting) don't draw from src/data at all.
      const itemIds = game?.noCategories
        ? []
        : drawItems(categoryIds, count, itemPool, game?.groupOf, mode);
      setRound({ categories: categoryIds, itemIds, modeId, presetId });
      setRoundSeq((n) => n + 1);
    },
    [gameId],
  );

  const goHome = useCallback(() => {
    setRound(null);
    setGameId(null);
  }, []);

  // Returns to Setup for the same game (pick a different topic/difficulty)
  // without leaving all the way back to the game menu.
  const backToSetup = useCallback(() => setRound(null), []);

  if (!gameId) return <HomeScreen onSelectGame={setGameId} />;

  if (!round) {
    return <SetupScreen game={getGame(gameId)} onStart={startRound} onBack={goHome} />;
  }

  return (
    <GameScreen
      gameId={gameId}
      itemIds={round.itemIds}
      modeId={round.modeId}
      presetId={round.presetId}
      roundKey={roundSeq}
      onExit={goHome}
      onBackToSetup={backToSetup}
      onPlayAgain={() => startRound(round.categories, round.itemIds.length, round.modeId, round.presetId)}
    />
  );
}
```

- [ ] **Step 2: Update `src/screens/GameScreen.tsx`**

Replace the whole file (drops the itemIds-derived `boardKey` memo in favor of the explicit `roundKey` prop from `App.tsx`, and threads `presetId` through to the board):

```tsx
// src/screens/GameScreen.tsx
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getBoard } from '../games/boards';

interface GameScreenProps {
  gameId: string;
  itemIds: string[];
  modeId?: string;
  presetId?: string;
  /** Bumped by App.tsx on every startRound call; remounts the board for a fresh game. */
  roundKey: number;
  onExit: () => void;
  onBackToSetup: () => void;
  onPlayAgain: () => void;
}

export function GameScreen({
  gameId,
  itemIds,
  modeId,
  presetId,
  roundKey,
  onExit,
  onBackToSetup,
  onPlayAgain,
}: GameScreenProps) {
  const [won, setWon] = useState(false);
  // getBoard looks up an existing component from a static module-level map, it
  // never defines a new one, so identity stays stable across renders for a given
  // gameId — this is a false positive from the "components created during render" rule.
  const Board = useMemo(() => getBoard(gameId), [gameId]);

  return (
    <main className="from-sky-deep to-sky-soft relative flex min-h-screen flex-col bg-gradient-to-b">
      <button
        type="button"
        onClick={onExit}
        className="m-4 self-start rounded-xl bg-white/80 px-4 py-2 font-bold text-earth shadow"
      >
        ← Trang chủ
      </button>

      {/* oxlint-disable-next-line react/static-components -- false positive: Board is
          a stable reference looked up from a static map, not created during render */}
      <Board
        key={roundKey}
        itemIds={itemIds}
        modeId={modeId}
        presetId={presetId}
        onComplete={() => setWon(true)}
      />

      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/40"
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-7xl">
              🎉
            </motion.div>
            <button
              type="button"
              onClick={() => {
                setWon(false);
                onPlayAgain();
              }}
              className="rounded-full bg-sunny px-8 py-4 text-2xl font-extrabold text-earth shadow-lg active:scale-95"
            >
              Chơi lại
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBackToSetup}
                className="rounded-full bg-white/90 px-5 py-3 font-bold text-earth shadow active:scale-95"
              >
                ⚙️ Đổi độ khó
              </button>
              <button
                type="button"
                onClick={onExit}
                className="rounded-full bg-white/90 px-5 py-3 font-bold text-earth shadow active:scale-95"
              >
                🏠 Trang chủ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
```

- [ ] **Step 3: Update `src/games/boards.tsx`**

```tsx
// src/games/boards.tsx
import type { ComponentType } from 'react';
import { MemoryMatchBoard } from './memory-match/MemoryMatchBoard';
import { ShadowMatchBoard } from './shadow-match/ShadowMatchBoard';
import { SortBoard } from './sort/SortBoard';
import { CountingBoard } from './counting/CountingBoard';

export interface BoardProps {
  itemIds: string[];
  onComplete: () => void;
  /** Which sort-mode was chosen in Setup (only used by games with GameMeta.sortModes). */
  modeId?: string;
  /** Which difficulty preset was chosen in Setup (only used by games with GameMeta.presets). */
  presetId?: string;
}

// Every game's board component conforms to BoardProps, so GameScreen can render
// any of them generically by looking up the current game id here.
const boards: Record<string, ComponentType<BoardProps>> = {
  'memory-match': MemoryMatchBoard,
  'shadow-match': ShadowMatchBoard,
  sort: SortBoard,
  counting: CountingBoard,
};

export function getBoard(gameId: string): ComponentType<BoardProps> {
  const board = boards[gameId];
  if (!board) throw new Error(`Unknown game board: ${gameId}`);
  return board;
}
```

- [ ] **Step 4: Commit**

(This won't typecheck until Task 7 creates `CountingBoard` — that's the very next task, so run `npx tsc -b` only after Task 7's Step 4 below, not here.)

```bash
git add src/App.tsx src/screens/GameScreen.tsx src/games/boards.tsx
git commit -m "feat: wire presetId and a robust round remount key through App/GameScreen/boards"
```

---

### Task 7: `CountingBoard` UI component

**Files:**
- Create: `src/games/counting/CountingBoard.tsx`

**Interfaces:**
- Consumes: `useCounting` (Task 3), `getCountingPreset` (Task 1), `useSound()` from `src/hooks/useSound.ts` (returns `{ playClick, playSuccess, playError }`, each `() => void`).
- Produces: `CountingBoard` — a React component matching the shape `boards.tsx` needs (`presetId?: string`, `onComplete: () => void`; `itemIds`/`modeId` are part of `BoardProps` but unused by this board, same pattern `modeId` already follows for `memory-match`).

- [ ] **Step 1: Write the implementation**

```tsx
// src/games/counting/CountingBoard.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { useCounting } from './useCounting';
import { getCountingPreset } from './presets';
import { useSound } from '../../hooks/useSound';

interface CountingBoardProps {
  presetId?: string;
  onComplete: () => void;
}

const RESPONSIVE_GRID =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(4rem,5rem))] justify-center gap-3 sm:gap-4';

export function CountingBoard({ presetId, onComplete }: CountingBoardProps) {
  const config = getCountingPreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, quantity, shape, choices, submitAnswer } = useCounting(config, {
    onComplete,
  });
  const [wrongPick, setWrongPick] = useState<number | null>(null);

  const handlePick = (value: number) => {
    playClick();
    if (submitAnswer(value)) {
      playSuccess();
      setWrongPick(null);
    } else {
      playError();
      setWrongPick(value);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 p-4 sm:p-6">
      <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
        Câu {round + 1}/{totalQuestions}
      </span>

      <div className={RESPONSIVE_GRID}>
        {Array.from({ length: quantity }, (_, i) => (
          <span key={i} className="text-center text-5xl sm:text-6xl">
            {shape}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {choices.map((value) => (
          <motion.button
            key={value}
            type="button"
            onClick={() => handlePick(value)}
            whileTap={{ scale: 0.9 }}
            animate={wrongPick === value ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sunny text-4xl font-extrabold text-earth shadow-lg sm:h-24 sm:w-24"
          >
            {value}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc -b`
Expected: no errors (this resolves the import Task 6 added).

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all test files PASS. (If 10+ files fail with "Failed to start threads worker" or a timeout, that's a known Node 25 + Vitest 4 environment flake in this project — simply re-run `npm test` once before treating it as real.)

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`, open the app, choose "🔢 Đếm số lượng" from the home menu, confirm:
- Setup screen shows no "Chủ đề" section, shows "Độ khó" with Dễ/Vừa/Khó buttons, "Chơi" is disabled until one is picked.
- Playing Dễ shows 5 questions; the shape count on screen matches the intended quantity; tapping the right number advances; tapping a wrong number does nothing but doesn't crash; after question 5 the 🎉 overlay appears.
- "Chơi lại" starts a fresh 5-question session (regression check for the `roundKey` fix in Task 6 — without it, the board would appear frozen on Chơi lại since itemIds is always `[]` for this game).
- Other three games (Lật hình, Bóng ai đây?, Phân loại) still play and "Chơi lại" still works, confirming the `roundKey` change didn't regress them.

- [ ] **Step 6: Commit**

```bash
git add src/games/counting/CountingBoard.tsx
git commit -m "feat: add CountingBoard UI for the counting game"
```

---

## Post-plan notes

- Addition/subtraction ("Cộng trừ") is a deliberately separate, later feature — do not fold it into this game's scope.
- No new localStorage keys are introduced; the counting game has no cross-round anti-repeat state (only "don't repeat the immediately previous quantity," handled in-memory by `useCounting`).
