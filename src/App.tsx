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
      onPlayAgain={() =>
        startRound(round.categories, round.itemIds.length, round.modeId, round.presetId)
      }
    />
  );
}
