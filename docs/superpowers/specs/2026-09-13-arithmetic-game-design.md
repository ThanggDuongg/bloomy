# Arithmetic Game ("Cộng trừ") — Design

**Date:** 2026-09-13
**Status:** Approved, ready for implementation plan

## 1. Goal & Scope

A sixth game teaching kids aged 2-5 basic addition and subtraction. Each round shows
two groups of identical shapes joined by an operator (`+` or `−`), and the child taps
the number matching the result among a few choices.

**Explicitly in scope:** both addition and subtraction, mixed randomly within a single
session (same "mix, don't make the child pick a mode first" pattern already chosen for
the compare game).

**Explicitly out of scope:** results with two digits (10+). The user flagged this
directly — a 2-5 year old reads single-digit numbers far more reliably than two-digit
ones, so every difficulty preset caps the result at 9, one digit lower than the
counting game's max of 10.

## 2. Relationship to existing games — no new shared infrastructure needed

Like the compare game, this needs **no new** shared infrastructure — it reuses exactly
what the counting game already added to `GameMeta`/Setup/App/GameScreen:

- `noCategories: true` — no topic-picker section in Setup.
- `presets` — a fixed Dễ/Vừa/Khó picker instead of the numeric slider.
- The generic `roundKey`-based remount fix in `GameScreen` already handles this game's
  `itemIds: []` correctly for "Chơi lại".
- The shared `SHAPES` emoji list (already extracted to `src/games/shapes.ts` during the
  compare game's implementation) is reused here too — same shape for both groups in a
  round, so the round is a pure arithmetic task, not a "spot the different icon" one.

This game is purely additive: a new `src/games/arithmetic/` module, one new `GameMeta`
entry, and one new `boards.tsx` registration.

## 3. Round generation

Each round independently randomizes:

- **`operator`**: `'+'` or `'-'` (50/50).
- **`shape`**: one emoji from the shared `SHAPES` list, used for both groups.
- **Two operands `a`, `b`** such that:
  - For `+`: `a, b >= 1` and `a + b <= config.maxResult` (never a trivial "+0").
  - For `-`: `a` (minuend) in `[1, config.maxResult]`, `b` (subtrahend) in `[1, a]`
    (never a trivial "-0"; result `a - b` is always `>= 0` and `< a`, so it can be 0
    but never negative).
- **`result`**: `a + b` or `a - b` depending on `operator` — always in `[0, 9]` given
  the presets below (never two digits).

The round displays: group of `a` shapes, the operator symbol, group of `b` shapes, an
`=`, then 4 tappable number choices (the correct result plus 3 nearby decoys, same
"prefer close decoys" idea as the counting game's `pickChoices` — but this game's
choices must cover `[0, config.maxResult]` since a subtraction result can be 0, unlike
counting's `pickChoices` which is `[1, max]`. This needs its own small variant, not a
reuse of counting's `pickChoices` as-is).

## 4. Difficulty presets

Same `GameMeta.presets` mechanism as counting/compare, with this game's own config:

```ts
interface ArithmeticConfig {
  questions: number;
  /** Every round's result stays in [0, maxResult] — capped at a single digit (9) per
   *  the user's explicit call: two-digit results are too hard to read at this age. */
  maxResult: number;
}
```

| Preset | questions | maxResult |
|--------|-----------|-----------|
| Dễ     | 5         | 5         |
| Vừa    | 7         | 7         |
| Khó    | 8         | 9         |

## 5. Interaction & feedback

- Question progress label ("Câu X/N") same as counting/compare.
- Two shape groups with the operator symbol between them, an `=` after, then 4 large
  tappable number buttons below — visually similar to `CountingBoard`'s layout (shape
  grid + number buttons) but with two shape groups and an operator instead of one.
- Tapping the correct number: success sound, advance to the next round (or finish the
  session after the last question — same win-overlay flow every game already uses).
- Tapping a wrong number: soft error sound, no penalty, no round advance — matches the
  no-penalty pattern already established by counting and compare.

## 6. Module layout (mirrors `src/games/counting/` and `src/games/compare/`)

- `src/games/arithmetic/presets.ts` — `ArithmeticConfig`, `ArithmeticPreset`,
  `arithmeticPresets`, `getArithmeticPreset(id): ArithmeticConfig` (same shape/throw
  behavior as the other two games' preset modules).
- `src/games/arithmetic/pickChoices.ts` — pure function `pickChoices(correct: number,
  max: number, rng?: () => number): number[]`, returning 4 distinct choices in
  `[0, max]` including `correct`, preferring nearby decoys — a `[0, max]` variant of
  the counting game's `[1, max]` `pickChoices` (kept as its own small file rather than
  generalizing the counting one, to avoid coupling the two games' modules together
  over a few lines of range math).
- `src/games/arithmetic/useArithmetic.ts` — round-sequencing hook, structurally
  parallel to `useCounting`/`useCompare`: `{ round, totalQuestions, operator, shape, a,
  b, result, choices, isComplete, submitAnswer(value: number): boolean }`.
- `src/games/arithmetic/ArithmeticBoard.tsx` — renders the two shape groups + operator
  + `=` + the 4 number choices, matching `BoardProps` (uses only `presetId`/
  `onComplete`, ignores `itemIds`/`modeId` — same pattern `CountingBoard`/
  `CompareBoard` already follow).

## 7. Registry & wiring changes

- `src/games/registry.ts`: one new entry, no interface changes:

```ts
{
  id: 'arithmetic',
  name: 'Cộng trừ',
  emoji: '➕',
  minCount: 0,
  maxCount: 0,
  defaultCount: 0,
  noCategories: true,
  presets: arithmeticPresets,
},
```

- `src/games/boards.tsx`: register `arithmetic: ArithmeticBoard`.
- No changes to `App.tsx`, `SetupScreen.tsx`, or `GameScreen.tsx`.

## 8. Testing

- `pickChoices` (arithmetic's `[0, max]` variant): pure function, fully unit-testable
  (distinctness, contains correct, respects `[0, max]` bounds, behaves at boundary
  values of `correct` including 0).
- `useArithmetic`: renderHook tests — advances round on correct answer, does not
  advance on wrong answer, keeps every generated `result` within `[0,
  config.maxResult]`, subtraction never produces a negative operand pairing, marks
  `isComplete` after the configured number of questions.
- `ArithmeticBoard`: no dedicated render test — consistent with every other board in
  this codebase.
- `presets.ts`: a small test mirroring the other two games' `presets.test.ts`.

## 9. Out of scope

- Results with two digits (10+) — explicitly rejected by the user for this age group.
- Multiplication/division (not requested; a much later-age concept).
- Missing-operand problems (e.g. "3 + ? = 5") — only "find the result" is in scope.
