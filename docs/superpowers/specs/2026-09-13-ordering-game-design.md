# Ordering Game ("Sắp xếp kích thước") — Design

**Date:** 2026-09-13
**Status:** Approved, ready for implementation plan

## 1. Goal & Scope

A seventh game teaching kids aged 2-5 to order things by size. Each round shows N
identical shapes at different sizes, scattered in a tray; the child drags them, one at
a time, into N empty slots arranged left-to-right so the sizes read smallest → largest.

**Explicitly in scope:** always asking for smallest → largest (not mixed with
largest → smallest) — the user picked the simpler, single-direction design so the
child never has to re-read instructions mid-session. Item count (3 or 4) and how close
together the sizes are both scale with difficulty.

**Explicitly out of scope:** largest → smallest mixed into the same session (rejected
in favor of a fixed, simpler direction); ordering by anything other than size (e.g.
quantity) — this game is purely about the size-ordering skill.

## 2. Relationship to existing games

Unlike the last three games (counting, compare, arithmetic), which needed **zero** new
shared infrastructure, this game reuses infrastructure from **two** different existing
games:

- `GameMeta.noCategories` / `GameMeta.presets` / the `roundKey` remount fix — same
  reuse as counting/compare/arithmetic (no Setup/App/GameScreen changes needed).
- Drag-and-drop hit-testing (`src/lib/hitTest.ts`: `findMatchingSlot`, `eventPoint`) —
  the same shared module the Sort and Shadow Match games already use for "drop this
  dragged thing onto the right target" detection.
- The shared `SHAPES` list (`src/games/shapes.ts`) — same as counting/compare/
  arithmetic, for the same reason (avoids photo-based size confusion, per the compare
  game's earlier size-comparison decision).

What's genuinely new: this is the first game combining **both** patterns at once — a
multi-round session (like counting/compare/arithmetic's "Câu X/N" progression) where
each individual round is itself a drag-and-drop task with several pieces to place (like
Sort's single drag-and-drop board). Because of that overlap, this game needs its own
round-sequencing hook rather than reusing `useSort` directly — `useSort` has no concept
of "round N of M," and retrofitting one would complicate a hook the Sort game already
depends on. The overlap in matching logic (a small "is this drop in the right target?"
check) is small enough that duplicating it here is clearer than sharing it.

## 3. Round generation

Each round:

- Picks one shape from the shared `SHAPES` list, used for every item in the round (so
  the task is purely about comparing sizes, not identifying different icons).
- Picks `config.itemCount` distinct magnitudes in `[1, 10]` (same 1-10 scale the
  compare game uses), each consecutive pair (once sorted) at least `config.minGap`
  apart — reusing the compare game's "smaller gap = harder to tell apart" idea.
- Assigns each magnitude a synthetic id and shuffles the display order for the tray,
  while separately recording each id's correct slot (its rank when magnitudes are
  sorted ascending: rank 0 = smallest, going up to `itemCount - 1` = largest).

The round is complete once every item has been dropped into its correct slot.

## 4. Difficulty presets

Same `GameMeta.presets` mechanism as the other three recent games:

```ts
interface OrderingConfig {
  questions: number;
  itemCount: number;
  /** Minimum gap between consecutive sorted magnitudes, in [1, 10] — smaller gap =
   *  sizes look more alike = harder to compare at a glance. */
  minGap: number;
}
```

| Preset | questions | itemCount | minGap |
|--------|-----------|-----------|--------|
| Dễ     | 5         | 3         | 3      |
| Vừa    | 6         | 3         | 2      |
| Khó    | 7         | 4         | 1      |

## 5. Interaction & feedback

- N empty slot boxes in a horizontal row, smallest-to-largest left-to-right, with a
  small hint ("Nhỏ nhất → Lớn nhất" or similar) above them.
- Below, a tray of the round's shapes (rendered at their actual relative sizes) that
  the child drags one at a time — same drag mechanics (`motion` `drag`,
  `dragSnapToOrigin`, `onDragEnd` + `findMatchingSlot`/`eventPoint`) already used by
  the Sort game.
- Dropping an item on its correct slot: the item visually settles into that slot
  (removed from the tray, same "settles into place" pattern the Sort game uses for its
  baskets), success sound. Once all N slots are filled, advance to the next round (or
  finish the session after the last question — same win-overlay flow every game uses).
- Dropping an item on the wrong slot (or missing all slots): the item snaps back to
  the tray, a soft error sound, no penalty, no round advance — same no-penalty pattern
  every recent game already follows.

## 6. Module layout (mirrors existing game folders)

- `src/games/ordering/presets.ts` — `OrderingConfig`, `OrderingPreset`,
  `orderingPresets`, `getOrderingPreset(id): OrderingConfig` (same shape/throw
  behavior as the other three preset modules).
- `src/games/ordering/pickMagnitudes.ts` — pure function `pickMagnitudes(itemCount:
  number, minGap: number, max: number, rng?: () => number): number[]`, returning
  `itemCount` ascending magnitudes in `[1, max]` with consecutive gaps `>= minGap`,
  without a rejection-sampling loop (same reasoning as the compare game's
  `pickOther`). Assumes `minGap * (itemCount - 1) <= max - 1` — true for every
  ordering preset (`3*2=6<=9`, `2*2=4<=9`, `1*3=3<=9`).
- `src/games/ordering/useOrdering.ts` — round-and-drag-sequencing hook:
  `{ round, totalQuestions, shape, items: {id, magnitude}[] (tray order, unmatched
  only), itemCount, matched: Set<string>, isComplete, handleDrop(itemId: string,
  slotIndex: number | null): void }`. Internally tracks each round's correct
  id → slot-index mapping and only advances to the next round once every item is
  matched.
- `src/games/ordering/OrderingBoard.tsx` — renders the slot row + shape tray, wiring
  drag events through `findMatchingSlot`/`eventPoint` from `src/lib/hitTest.ts`,
  matching `BoardProps` (uses only `presetId`/`onComplete`, ignores `itemIds`/`modeId`
  — same pattern every recent board follows).

## 7. Registry & wiring changes

- `src/games/registry.ts`: one new entry, no interface changes:

```ts
{
  id: 'ordering',
  name: 'Sắp xếp kích thước',
  emoji: '📏',
  minCount: 0,
  maxCount: 0,
  defaultCount: 0,
  noCategories: true,
  presets: orderingPresets,
},
```

- `src/games/boards.tsx`: register `ordering: OrderingBoard`.
- No changes to `App.tsx`, `SetupScreen.tsx`, or `GameScreen.tsx`.

## 8. Testing

- `pickMagnitudes`: pure function, fully unit-testable (returns the right count,
  ascending order, every consecutive gap `>= minGap`, stays within `[1, max]`).
- `useOrdering`: renderHook tests — a correct drop marks that item matched and (once
  all are matched) advances the round; a wrong-slot drop does not mark anything
  matched and does not advance; marks `isComplete` after the configured number of
  questions.
- `OrderingBoard`: no dedicated render/drag test — consistent with every other board
  in this codebase (Sort and Shadow Match, which also do drag-and-drop, have no
  render tests either — only their underlying hooks are unit-tested).
- `presets.ts`: a small test mirroring the other three games' `presets.test.ts`.

## 9. Out of scope

- Largest → smallest ordering, or mixing both directions in one session.
- Ordering by quantity or any dimension other than size.
- More than 4 items per round (would crowd the slot row for this age group).
