import { useCallback, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { getCategory } from './data';
import { getGame } from './games/registry';
import { drawFromBag, loadBag, saveBag } from './lib/bag';

interface Round {
  categories: string[];
  itemIds: string[];
}

/** Draws `pairs` item ids from the union of the selected categories, avoiding repeats. */
function drawPairs(categoryIds: string[], pairs: number): string[] {
  const pool = categoryIds.flatMap((c) => getCategory(c).map((i) => i.id));
  const key = `bloomy:bag:${[...categoryIds].sort().join('+')}`;
  const { drawn, state } = drawFromBag(pool, pairs, loadBag(key));
  saveBag(key, state);
  return drawn;
}

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);

  const startRound = useCallback((categoryIds: string[], pairs: number) => {
    setRound({ categories: categoryIds, itemIds: drawPairs(categoryIds, pairs) });
  }, []);

  const goHome = useCallback(() => {
    setRound(null);
    setGameId(null);
  }, []);

  if (!gameId) return <HomeScreen onSelectGame={setGameId} />;

  if (!round) {
    return <SetupScreen game={getGame(gameId)} onStart={startRound} onBack={goHome} />;
  }

  return (
    <GameScreen
      itemIds={round.itemIds}
      onExit={goHome}
      onPlayAgain={() => startRound(round.categories, round.itemIds.length)}
    />
  );
}
