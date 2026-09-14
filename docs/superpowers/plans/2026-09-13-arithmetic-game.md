# Arithmetic Game ("Cộng trừ") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sixth game, "Cộng trừ" (➕), where the child sees two groups of identical shapes joined by `+` or `−`, and taps the number matching the result among a few choices.

**Architecture:** A self-contained `src/games/arithmetic/` module (presets data, a pure `pickChoices` answer-choice picker scoped to `[0, max]`, a `useArithmetic` round-sequencing hook, and an `ArithmeticBoard` component), plugged into the existing `registry.ts`/`boards.tsx`. Like the compare game, this needs **zero** changes to `App.tsx`, `SetupScreen.tsx`, or `GameScreen.tsx` — it reuses the `noCategories`/`presets`/`roundKey` infrastructure the counting game already added, and reuses the shared `SHAPES` list from `src/games/shapes.ts`.

**Tech Stack:** React 19 + TypeScript (strict), Tailwind CSS v4, Motion (`motion/react`), Vitest + `@testing-library/react`.

## Global Constraints

- No backend/database — this game is entirely computed client-side (no new localStorage keys).
- Player-facing strings in Vietnamese, matching every other game's copy.
- oxlint (not ESLint) is the linter; disable-comments (if ever needed) use `oxlint-disable-next-line <rule>` syntax placed directly above the flagged line.
- Every round's result must stay within `[0, 9]` — a single digit — per every preset's `maxResult` (5, 7, 9). Two-digit results are explicitly out of scope: the user flagged that a 2-5 year old reads single-digit numbers far more reliably.
- Subtraction operands must never produce a negative result (`b <= a` always).
- Multiplication/division and missing-operand problems ("3 + ? = 5") are explicitly out of scope for this plan.
- The counting, compare, memory-match, shadow-match, and sort games must keep passing their current tests and behavior unchanged.

---

### Task 1: Arithmetic presets data

**Files:**
- Create: `src/games/arithmetic/presets.ts`
- Test: `src/games/arithmetic/presets.test.ts`

**Interfaces:**
- Produces: `ArithmeticConfig { questions: number; maxResult: number }`, `ArithmeticPreset { id: string; name: string; config: ArithmeticConfig }`, `arithmeticPresets: ArithmeticPreset[]`, `getArithmeticPreset(id: string): ArithmeticConfig` (throws `Error` on unknown id).

- [ ] **Step 1: Write the failing test**

```ts
// src/games/arithmetic/presets.test.ts
import { describe, it, expect } from 'vitest';
import { arithmeticPresets, getArithmeticPreset } from './presets';

describe('arithmeticPresets', () => {
  it('has 3 presets: easy, medium, hard', () => {
    expect(arithmeticPresets.map((p) => p.id)).toEqual(['easy', 'medium', 'hard']);
  });

  it('increases maxResult and questions from easy to hard, capped at a single digit', () => {
    const [easy, medium, hard] = arithmeticPresets;
    expect(easy.config.maxResult).toBeLessThan(medium.config.maxResult);
    expect(medium.config.maxResult).toBeLessThan(hard.config.maxResult);
    expect(hard.config.maxResult).toBeLessThanOrEqual(9);
    expect(easy.config.questions).toBeLessThanOrEqual(medium.config.questions);
    expect(medium.config.questions).toBeLessThanOrEqual(hard.config.questions);
  });
});

describe('getArithmeticPreset', () => {
  it('returns the config for a known preset id', () => {
    expect(getArithmeticPreset('easy')).toEqual({ questions: 5, maxResult: 5 });
  });

  it('throws for an unknown preset id', () => {
    expect(() => getArithmeticPreset('nope')).toThrow('Unknown arithmetic preset: nope');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/arithmetic/presets.test.ts`
Expected: FAIL — `Cannot find module './presets'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/arithmetic/presets.ts
export interface ArithmeticConfig {
  /** How many rounds make up one session. */
  questions: number;
  /** Every round's result stays in [0, maxResult] — capped at a single digit (9) per
   *  the user's explicit call: two-digit results are too hard to read at this age. */
  maxResult: number;
}

export interface ArithmeticPreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: ArithmeticConfig;
}

export const arithmeticPresets: ArithmeticPreset[] = [
  { id: 'easy', name: 'Dễ', config: { questions: 5, maxResult: 5 } },
  { id: 'medium', name: 'Vừa', config: { questions: 7, maxResult: 7 } },
  { id: 'hard', name: 'Khó', config: { questions: 8, maxResult: 9 } },
];

export function getArithmeticPreset(id: string): ArithmeticConfig {
  const preset = arithmeticPresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown arithmetic preset: ${id}`);
  return preset.config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/arithmetic/presets.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/arithmetic/presets.ts src/games/arithmetic/presets.test.ts
git commit -m "feat: add arithmetic game difficulty presets"
```

---

### Task 2: Answer-choice picker (`pickChoices`, `[0, max]` variant)

**Files:**
- Create: `src/games/arithmetic/pickChoices.ts`
- Test: `src/games/arithmetic/pickChoices.test.ts`

**Interfaces:**
- Consumes: `shuffle` from `src/lib/shuffle.ts` — `shuffle<T>(input: readonly T[], rng?: () => number): T[]`.
- Produces: `pickChoices(correct: number, max: number, rng?: () => number): number[]` — always returns 4 distinct numbers in `[0, max]` including `correct`. This is a `[0, max]` sibling of the counting game's `[1, max]` `pickChoices` (arithmetic results can be 0, e.g. `1 - 1`), kept as its own file rather than generalizing the counting one.

- [ ] **Step 1: Write the failing test**

```ts
// src/games/arithmetic/pickChoices.test.ts
import { describe, it, expect } from 'vitest';
import { pickChoices } from './pickChoices';

describe('pickChoices', () => {
  it('always includes the correct answer', () => {
    const choices = pickChoices(3, 9, () => 0.5);
    expect(choices).toContain(3);
  });

  it('returns 4 distinct numbers within [0, max]', () => {
    const choices = pickChoices(3, 9, () => 0.5);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    for (const n of choices) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('still returns 4 distinct numbers when the correct answer is 0', () => {
    const choices = pickChoices(0, 9, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([0, 1, 2, 3]));
  });

  it('still returns 4 distinct numbers when the correct answer is the max', () => {
    const choices = pickChoices(9, 9, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([9, 8, 7, 6]));
  });

  it('prefers decoys close to the correct answer', () => {
    const choices = pickChoices(5, 9, () => 0.5);
    expect(new Set(choices)).toEqual(new Set([3, 4, 5, 6]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/arithmetic/pickChoices.test.ts`
Expected: FAIL — `Cannot find module './pickChoices'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/arithmetic/pickChoices.ts
import { shuffle } from '../../lib/shuffle';

/**
 * Returns 4 shuffled distinct numbers within [0, max] that always include `correct`,
 * preferring numbers close to `correct` as decoys. A [0, max] sibling of the counting
 * game's [1, max] pickChoices — arithmetic results can be 0 (e.g. 1 - 1), which
 * counting's variant can't represent. Assumes max >= 3 (guaranteed by every
 * arithmetic preset's maxResult: 5, 7, or 9).
 */
export function pickChoices(
  correct: number,
  max: number,
  rng: () => number = Math.random,
): number[] {
  const decoys: number[] = [];
  for (let distance = 1; decoys.length < 3 && distance <= max; distance++) {
    for (const candidate of [correct - distance, correct + distance]) {
      if (decoys.length >= 3) break;
      if (candidate >= 0 && candidate <= max && candidate !== correct) {
        decoys.push(candidate);
      }
    }
  }
  return shuffle([correct, ...decoys], rng);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/arithmetic/pickChoices.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/arithmetic/pickChoices.ts src/games/arithmetic/pickChoices.test.ts
git commit -m "feat: add pickChoices for the arithmetic game's answer options"
```

---

### Task 3: Round-sequencing hook (`useArithmetic`)

**Files:**
- Create: `src/games/arithmetic/useArithmetic.ts`
- Test: `src/games/arithmetic/useArithmetic.test.ts`

**Interfaces:**
- Consumes: `ArithmeticConfig` from `./presets` (Task 1); `pickChoices` from `./pickChoices` (Task 2); `SHAPES` from `../shapes` (already exists — extracted during the compare game's implementation).
- Produces: `useArithmetic(config: ArithmeticConfig, options: { onComplete: () => void; rng?: () => number }): { round: number; totalQuestions: number; operator: '+' | '-'; shape: string; a: number; b: number; result: number; choices: number[]; isComplete: boolean; submitAnswer: (value: number) => boolean }`. `submitAnswer` returns `true` and advances the round (or completes) only when `value` equals `result`; otherwise returns `false` and the round does not advance.

- [ ] **Step 1: Write the failing test**

```ts
// src/games/arithmetic/useArithmetic.test.ts
import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useArithmetic } from './useArithmetic';

const config = { questions: 3, maxResult: 5 };
const rng = () => 0.5;

describe('useArithmetic', () => {
  it('starts at round 0 with a result within [0, maxResult] and matching choices', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.result).toBeGreaterThanOrEqual(0);
    expect(result.current.result).toBeLessThanOrEqual(5);
    expect(result.current.choices).toContain(result.current.result);
  });

  it('computes the result consistently with the operator and operands', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    const expected =
      result.current.operator === '+'
        ? result.current.a + result.current.b
        : result.current.a - result.current.b;
    expect(result.current.result).toBe(expected);
  });

  it('never produces a negative subtraction result', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    if (result.current.operator === '-') {
      expect(result.current.a).toBeGreaterThanOrEqual(result.current.b);
    }
  });

  it('advances to the next round on a correct answer', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    const correct = result.current.result;
    act(() => {
      expect(result.current.submitAnswer(correct)).toBe(true);
    });
    expect(result.current.round).toBe(1);
  });

  it('does not advance on a wrong answer', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    const wrong = result.current.choices.find((c) => c !== result.current.result)!;
    act(() => {
      expect(result.current.submitAnswer(wrong)).toBe(false);
    });
    expect(result.current.round).toBe(0);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useArithmetic(config, { onComplete, rng }));
    for (let i = 0; i < config.questions; i++) {
      act(() => {
        result.current.submitAnswer(result.current.result);
      });
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/arithmetic/useArithmetic.test.ts`
Expected: FAIL — `Cannot find module './useArithmetic'`

- [ ] **Step 3: Write the implementation**

```ts
// src/games/arithmetic/useArithmetic.ts
import { useState } from 'react';
import { SHAPES } from '../shapes';
import { pickChoices } from './pickChoices';
import type { ArithmeticConfig } from './presets';

export interface UseArithmeticOptions {
  onComplete: () => void;
  rng?: () => number;
}

export interface UseArithmeticResult {
  round: number;
  totalQuestions: number;
  operator: '+' | '-';
  shape: string;
  a: number;
  b: number;
  result: number;
  choices: number[];
  isComplete: boolean;
  /** Returns true and advances the round only when `value` equals the result. */
  submitAnswer: (value: number) => boolean;
}

interface RoundState {
  round: number;
  operator: '+' | '-';
  shape: string;
  a: number;
  b: number;
  result: number;
  choices: number[];
}

function pickRound(round: number, config: ArithmeticConfig, rng: () => number): RoundState {
  const operator: '+' | '-' = rng() < 0.5 ? '+' : '-';
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];

  let a: number;
  let b: number;
  let result: number;
  if (operator === '+') {
    // a in [1, maxResult-1], b in [1, maxResult-a] so a+b never exceeds maxResult.
    a = 1 + Math.floor(rng() * (config.maxResult - 1));
    b = 1 + Math.floor(rng() * (config.maxResult - a));
    result = a + b;
  } else {
    // a (minuend) in [1, maxResult], b (subtrahend) in [1, a] so a-b is always >= 0.
    a = 1 + Math.floor(rng() * config.maxResult);
    b = 1 + Math.floor(rng() * a);
    result = a - b;
  }

  return { round, operator, shape, a, b, result, choices: pickChoices(result, config.maxResult, rng) };
}

/**
 * Drives one arithmetic session: a sequence of `config.questions` rounds, each
 * showing two shape groups joined by `+` or `-` and asking the player to pick the
 * result. Advances only on a correct answer; a wrong tap doesn't move the round
 * forward (no penalty).
 */
export function useArithmetic(
  config: ArithmeticConfig,
  { onComplete, rng = Math.random }: UseArithmeticOptions,
): UseArithmeticResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, rng));
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = (value: number): boolean => {
    if (isComplete || value !== state.result) return false;

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
    operator: state.operator,
    shape: state.shape,
    a: state.a,
    b: state.b,
    result: state.result,
    choices: state.choices,
    isComplete,
    submitAnswer,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/arithmetic/useArithmetic.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/games/arithmetic/useArithmetic.ts src/games/arithmetic/useArithmetic.test.ts
git commit -m "feat: add useArithmetic round-sequencing hook"
```

---

### Task 4: `ArithmeticBoard` UI component

**Files:**
- Create: `src/games/arithmetic/ArithmeticBoard.tsx`

**Interfaces:**
- Consumes: `useArithmetic` (Task 3), `getArithmeticPreset` (Task 1), `useSound()` from `src/hooks/useSound.ts` (returns `{ playClick, playSuccess, playError }`, each `() => void`).
- Produces: `ArithmeticBoard` — a React component matching the shape `boards.tsx` needs (`presetId?: string`, `onComplete: () => void`; `itemIds`/`modeId` are part of `BoardProps` but unused here, same pattern `CountingBoard`/`CompareBoard` already follow).

- [ ] **Step 1: Write the implementation**

```tsx
// src/games/arithmetic/ArithmeticBoard.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { useArithmetic } from './useArithmetic';
import { getArithmeticPreset } from './presets';
import { useSound } from '../../hooks/useSound';

interface ArithmeticBoardProps {
  presetId?: string;
  onComplete: () => void;
}

function ShapeGroup({ shape, count }: { shape: string; count: number }) {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(2rem,2.5rem))] justify-center gap-1 p-3">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="text-center text-2xl">
          {shape}
        </span>
      ))}
    </div>
  );
}

export function ArithmeticBoard({ presetId, onComplete }: ArithmeticBoardProps) {
  const config = getArithmeticPreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, operator, shape, a, b, choices, submitAnswer } = useArithmetic(
    config,
    { onComplete },
  );
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

      <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-sunny shadow-lg sm:h-36 sm:w-36">
          <ShapeGroup shape={shape} count={a} />
        </div>
        <span className="text-4xl font-extrabold text-earth">{operator}</span>
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-sunny shadow-lg sm:h-36 sm:w-36">
          <ShapeGroup shape={shape} count={b} />
        </div>
        <span className="text-4xl font-extrabold text-earth">=</span>
        <span className="text-4xl font-extrabold text-earth">?</span>
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

- [ ] **Step 2: Commit**

```bash
git add src/games/arithmetic/ArithmeticBoard.tsx
git commit -m "feat: add ArithmeticBoard UI for the arithmetic game"
```

---

### Task 5: Registry entry, `boards.tsx` registration, and full verification

**Files:**
- Modify: `src/games/registry.ts`
- Modify: `src/games/boards.tsx`

**Interfaces:**
- Consumes: `arithmeticPresets` from `./arithmetic/presets` (Task 1); `ArithmeticBoard` from `./arithmetic/ArithmeticBoard` (Task 4).
- Produces: nothing new consumed by later tasks — this is the final wiring task.

- [ ] **Step 1: Add the import and registry entry to `src/games/registry.ts`**

Add alongside the existing imports:

```ts
import { arithmeticPresets } from './arithmetic/presets';
```

Append to the `games` array, after the `compare` entry:

```ts
  {
    id: 'arithmetic',
    name: 'Cộng trừ',
    emoji: '➕',
    // Same reasoning as counting/compare: presets replace the numeric slider, so
    // these three fields are required by GameMeta but unused here.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: arithmeticPresets,
  },
```

- [ ] **Step 2: Register the board in `src/games/boards.tsx`**

Add the import:

```ts
import { ArithmeticBoard } from './arithmetic/ArithmeticBoard';
```

Add the entry to the `boards` record:

```ts
  arithmetic: ArithmeticBoard,
```

(so the full record reads `{ 'memory-match': MemoryMatchBoard, 'shadow-match': ShadowMatchBoard, sort: SortBoard, counting: CountingBoard, compare: CompareBoard, arithmetic: ArithmeticBoard }`)

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

Run: `npm run dev`, open the app, choose "➕ Cộng trừ" from the home menu, confirm:
- Setup screen shows no "Chủ đề" section, shows "Độ khó" with Dễ/Vừa/Khó buttons, "Chơi" is disabled until one is picked.
- Playing any preset shows a mix of `+` and `-` rounds (not always the same operator), and every result shown/asked is a single digit (0-9).
- The two shape groups render without overflowing their cards (this game reuses the same grid pattern the compare game needed a `w-full` fix for — check it didn't regress here).
- Tapping the correct number advances; tapping the wrong number shakes that button and doesn't crash or advance.
- After the last question the 🎉 overlay appears, and "Chơi lại" starts a fresh session.
- The counting and compare games still work (regression check, since this task's `boards.tsx` edit touches a file they also depend on).

- [ ] **Step 8: Commit**

```bash
git add src/games/registry.ts src/games/boards.tsx
git commit -m "feat: register the arithmetic game"
```

---

## Post-plan notes

- Two-digit results, multiplication/division, and missing-operand problems are deliberately out of scope — do not fold them into this game.
- No new localStorage keys are introduced; this game has no cross-round anti-repeat state (not requested, same as the compare game).
