export interface GameMeta {
  id: string;
  /** Vietnamese display name shown in the home menu. */
  name: string;
  emoji: string;
  minPairs: number;
  maxPairs: number;
  defaultPairs: number;
}

// The catalogue of games shown on the home menu. Add a new entry here (and wire its
// screen in App) to grow the menu.
export const games: GameMeta[] = [
  { id: 'memory-match', name: 'Lật hình', emoji: '🎴', minPairs: 3, maxPairs: 10, defaultPairs: 6 },
];

export function getGame(id: string): GameMeta {
  const game = games.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game: ${id}`);
  return game;
}
