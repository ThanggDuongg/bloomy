# Compare Game ("So sánh") — Design

**Date:** 2026-09-12
**Status:** Approved, ready for implementation plan

## 1. Goal & Scope

A fifth game teaching kids aged 2-5 basic comparison: which of two things is bigger/
smaller (size), and which of two groups has more/fewer (quantity). Each round shows two
options side by side; the child taps the one matching the asked direction.

**Explicitly in scope:** both comparison types (size, quantity) and both directions
(bigger/smaller, more/fewer), mixed randomly within a single session — the user
explicitly chose the mixed variant over a simpler "pick one type up front" design,
accepting that a session asks the child to switch comparison skill mid-session.

**Out of scope:** length (dài/ngắn) and height (cao/thấp) comparisons — deferred, not
requested for this iteration. Real item photos (fruit/animal) — rejected because a
photo's on-screen size doesn't reflect the real object's size (a photographed elephant
rendered small would look like a "small elephant" and misteach real-world scale); this
game reuses the same simple-emoji-shape approach as the counting game instead.

## 2. Relationship to existing games — no new shared infrastructure needed

Unlike the counting game (which had to add `GameMeta.noCategories` and `GameMeta.presets`
to the shared Setup/App/GameScreen/boards infrastructure), this game needs **no new**
infrastructure — it reuses exactly what counting already added:

- `noCategories: true` — no topic-picker section in Setup.
- `presets` — a fixed Dễ/Vừa/Khó picker instead of the numeric slider.
- The generic `roundKey`-based remount fix in `GameScreen` (from the counting game's
  plan) already makes "Chơi lại" work correctly for any game with `itemIds: []`.

So this game is purely additive: a new `src/games/compare/` module, one new
`GameMeta` entry, and one new `boards.tsx` registration — no other file changes.

## 3. Round generation

Each round independently randomizes:

- **`type`**: `'size'` or `'quantity'` (50/50).
- **`wantGreater`**: `true` (asking for the bigger/more one) or `false` (asking for the
  smaller/fewer one) (50/50). The displayed label depends on `type` + `wantGreater`:
  `size`+true → "To hơn", `size`+false → "Nhỏ hơn", `quantity`+true → "Nhiều hơn",
  `quantity`+false → "Ít hơn".
- **`shape`**: one emoji from a fixed list (reusing the counting game's `SHAPES` list
  or an equivalent), same shape used for both sides so the round is a pure comparison,
  not a "spot the different icon" task.
- **Two distinct magnitudes** in `[1, 10]`, at least `config.minGap` apart (see
  Difficulty below) — one becomes the `size` (rendered icon size) or `quantity`
  (rendered icon count) for the left side, the other for the right side. Which
  magnitude lands on which side is itself randomized each round, so the correct answer
  isn't predictably always on one side.

The correct side is computed directly from the two magnitudes and `wantGreater` — no
separate "answer bank" needed (there are only 2 choices, not 4 like the counting game).

## 4. Difficulty presets

Reusing the exact `GameMeta.presets` mechanism from the counting game (`{id, name,
config}[]`), with this game's own config shape:

```ts
interface CompareConfig {
  questions: number;
  /** Minimum gap between the two rounds' magnitudes, in [1, 10] — smaller gap = the
   *  two options look more alike = harder to tell apart at a glance. */
  minGap: number;
}
```

| Preset | questions | minGap |
|--------|-----------|--------|
| Dễ     | 5         | 4      |
| Vừa    | 7         | 2      |
| Khó    | 8         | 1      |

## 5. Interaction & feedback

- Two large tappable cards, left and right, each showing either one scaled-up/down
  shape (`size` rounds) or a small grid of the shape repeated N times (`quantity`
  rounds).
- The question label ("To hơn" / "Nhỏ hơn" / "Nhiều hơn" / "Ít hơn") is shown above
  the two cards.
- Tapping the correct side: success sound, advance to the next round (or finish the
  session after the last question — same win-overlay flow every game already uses).
- Tapping the wrong side: a soft error sound, no penalty, no round advance — the
  child can just try again. This matches the counting game's already-established
  no-penalty pattern.

## 6. Module layout (mirrors `src/games/counting/`)

- `src/games/compare/presets.ts` — `CompareConfig`, `ComparePreset`, `comparePresets`,
  `getComparePreset(id): CompareConfig` (same shape/throw behavior as the counting
  game's `getCountingPreset`).
- `src/games/compare/pickOther.ts` — pure function `pickOther(a: number, minGap: number,
  max: number, rng?: () => number): number`, returning a value in `[1, max]` at least
  `minGap` away from `a`, without a rejection-sampling loop (same reasoning as the
  counting game's `pickQuantity`: a fixed/degenerate `rng` must not loop forever).
- `src/games/compare/useCompare.ts` — round-sequencing hook, structurally parallel to
  `useCounting`: `{ round, totalQuestions, type, wantGreater, shape, left, right,
  isComplete, submitAnswer(side: 'left' | 'right'): boolean }`.
- `src/games/compare/CompareBoard.tsx` — renders the question label + the two tappable
  side cards, matching `BoardProps` (uses only `presetId`/`onComplete`, ignores
  `itemIds`/`modeId` — same pattern `CountingBoard` already follows).

## 7. Registry & wiring changes

- `src/games/registry.ts`: one new entry, no interface changes:

```ts
{
  id: 'compare',
  name: 'So sánh',
  emoji: '⚖️',
  minCount: 0,
  maxCount: 0,
  defaultCount: 0,
  noCategories: true,
  presets: comparePresets,
},
```

- `src/games/boards.tsx`: register `compare: CompareBoard`.
- No changes to `App.tsx`, `SetupScreen.tsx`, or `GameScreen.tsx` — all the plumbing
  (`presetId` passthrough, `noCategories` handling, `roundKey` remount) already exists
  from the counting game.

## 8. Testing

- `pickOther`: pure function, fully unit-testable (respects `[1, max]` bounds, always
  at least `minGap` away from `a`, behaves at boundary values of `a`).
- `useCompare`: renderHook tests — advances round on correct side tap, does not
  advance on wrong side tap, computes the correct side consistently with `wantGreater`
  and the two magnitudes, marks `isComplete` after the configured number of questions.
- `CompareBoard`: no dedicated render test — consistent with every other board in this
  codebase (none have render/smoke tests; only pure logic and hooks are unit-tested).
- `presets.ts`: a small test mirroring the counting game's `presets.test.ts` (preset
  list shape + `getComparePreset` throw-on-unknown-id behavior).

## 9. Out of scope

- Length (dài/ngắn) and height (cao/thấp) comparisons (future, not requested now).
- Per-type Setup mode selection (explicitly rejected by the user in favor of mixing
  both types/directions within one session).
- Real item photos instead of abstract shapes (misleading for size comparisons).
