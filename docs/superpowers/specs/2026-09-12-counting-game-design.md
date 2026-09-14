# Counting Game ("Đếm số lượng") — Design

**Date:** 2026-09-12
**Status:** Approved, ready for implementation plan

## 1. Goal & Scope

A new game teaching kids aged 2-5 to count quantities 1-10 and recognize the matching
numeral. The child sees a group of identical simple shapes, counts them, and taps the
correct number out of a few choices.

**Explicitly out of scope for this iteration:** addition/subtraction. Counting quantities
and simple arithmetic are different skills aimed at different sub-ages within the 2-5
range (counting fits 2-3+, arithmetic fits closer to 5-6). Arithmetic may become a
separate game or a mode of this one later, but is not built now.

## 2. How this game differs architecturally from existing games

Every existing game (Lật hình, Bóng ai đây?, Phân loại) is built around one static
board: draw N items up front, render them all, let the player interact until every item
is resolved. This game is a **sequence of independent rounds** (one counting question
after another) — there's no "board" of items to draw from `src/data` at all; each round
generates its own random quantity and shape on the fly. Consequently:

- **No category selection.** The game doesn't use fruit/animal/color data; Setup skips
  the "Chủ đề" section entirely for this game.
- **No shared item pool / `itemPool` / `groupOf` fields apply.** This game's `GameMeta`
  entry needs a different shape.
- **Difficulty isn't a single slider value.** Difficulty must set two things at once
  (max countable number, and how many questions make up a session), so Setup uses a
  small fixed 3-preset picker (Dễ/Vừa/Khó) for this game instead of the numeric
  `DifficultySelector` slider used everywhere else.

Both of these mean `GameMeta` needs a couple of new optional fields, and `SetupScreen`
needs to branch on them — this is the main "shared infrastructure" change in scope.

## 3. GameMeta changes

```ts
interface GameMeta {
  // ...existing fields...

  /** When true, Setup skips the category-selection section entirely. */
  noCategories?: boolean;

  /**
   * Fixed named difficulty presets (e.g. Dễ/Vừa/Khó), used instead of the numeric
   * min/max/default DifficultySelector when a game's difficulty isn't a single
   * linear quantity. Each preset carries whatever the specific game needs — the
   * shape is game-specific config, opaque to Setup/App beyond passing it through.
   */
  presets?: { id: string; name: string; config: unknown }[];
}
```

For the counting game specifically, each preset's `config` is:

```ts
interface CountingConfig {
  maxNumber: number; // count up to this
  questions: number; // how many rounds in the session
}
```

```ts
{
  id: 'counting',
  name: 'Đếm số lượng',
  emoji: '🔢',
  noCategories: true,
  presets: [
    { id: 'easy', name: 'Dễ', config: { maxNumber: 5, questions: 5 } satisfies CountingConfig },
    { id: 'medium', name: 'Vừa', config: { maxNumber: 8, questions: 7 } satisfies CountingConfig },
    { id: 'hard', name: 'Khó', config: { maxNumber: 10, questions: 8 } satisfies CountingConfig },
  ],
}
```

`minCount`/`maxCount`/`defaultCount` become unused for this game (SetupScreen won't
render the numeric slider when `presets` is set) — they're kept required on `GameMeta`
for now since every other game still needs them; the counting game entry can set
placeholder values that are simply never read (documented with a comment), avoiding a
wider refactor of the interface for a single game. (Self-review note: this is a known
wart — flagged rather than silently left unexplained.)

## 4. SetupScreen changes

- If `game.noCategories`, skip rendering the "Chủ đề" section and don't require any
  category to start (the `canStart` check drops the `selected.length > 0` requirement
  for this game).
- If `game.presets` is set, render a preset picker (single-select, same visual style as
  the existing category/mode chip buttons) instead of `<DifficultySelector>`. Selecting
  a preset stores its `id`; "Chơi" is disabled until one is chosen (mirrors how the sort
  game's mode picker already gates "Chơi" on a selection).
- `onStart` gains an optional `presetId` alongside the existing `(categoryIds, count,
  modeId)` signature. For a preset-based game, `categoryIds` is passed as `[]` and
  `count` is unused (0) — the board only cares about `presetId`.

## 5. Game logic (`src/games/counting/`)

**`useCounting(config: CountingConfig, options)` hook:**
- State: `round: number` (0-indexed), `quantity: number` (current round's answer),
  `shape: string` (current round's emoji), `isComplete: boolean`.
- On mount and after each correct answer, advances to a new round: picks a random
  quantity in `[1, config.maxNumber]` that differs from the previous round's quantity
  (reroll on collision, bounded attempts — same pattern as other anti-repeat logic in
  this codebase), and a random shape from a fixed `SHAPES` list.
- `submitAnswer(value: number)`: if `value === quantity`, fires `onCorrect`, advances
  the round (or marks `isComplete` if this was the last question); otherwise fires
  `onWrong` and does **not** advance — the child can just try again, no penalty.
- Pure answer-choice helper `pickChoices(correct: number, max: number, rng): number[]`
  (separate, testable function): returns 4 shuffled distinct numbers within `[1, max]`
  including `correct`, preferring numbers close to `correct` as decoys, falling back to
  any remaining numbers when `max` is small (e.g. `max = 5`).

**`CountingBoard.tsx`:**
- Props conform to the existing `BoardProps` shape (`itemIds` is unused/ignored for this
  game — `App.tsx`/`GameScreen` still pass it for interface consistency, but this board
  ignores it and drives everything from `presetId`).
- Renders the current round's shapes in a simple responsive grid (reusing the
  `grid-cols-[repeat(auto-fill,minmax(...))]` pattern already used by Shadow Match/Sort),
  and 4 big tappable number buttons below.
- On finishing all questions, calls `onComplete()` (same contract every other board
  already follows, so the existing win-overlay/GameScreen code needs no changes).

## 6. Data flow through App.tsx

`App.tsx`'s `startRound` needs to also thread a `presetId` through to `Round` state and
down to `GameScreen`/the board, parallel to how `modeId` already flows for the sort
game. `GameScreen`'s `BoardProps` gains an optional `presetId?: string`, unused by every
other existing board (same pattern as `modeId` today).

## 7. Testing

- `pickChoices`: pure function, fully unit-testable (distinctness, contains correct,
  respects `[1,max]` bounds, behaves at small `max`).
- `useCounting`: renderHook tests — advances round on correct answer, does not advance
  on wrong answer, avoids repeating the immediately-previous quantity, marks
  `isComplete` after the configured number of questions.
- `CountingBoard`: no interaction tests (numbers/taps, no drag — plain buttons, low
  risk); a basic render smoke test is enough, consistent with how other boards are
  tested in this codebase.

## 8. Out of scope

- Addition/subtraction (future, separate feature).
- Counting real item photos instead of abstract shapes (user explicitly chose plain
  shapes for this game to keep counting visually uncluttered).
- Sound narration of numbers (no TTS in the app yet).
