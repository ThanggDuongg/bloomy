import type { ComponentType } from 'react';
import { MemoryMatchBoard } from './memory-match/MemoryMatchBoard';
import { ShadowMatchBoard } from './shadow-match/ShadowMatchBoard';
import { SortBoard } from './sort/SortBoard';
import { CountingBoard } from './counting/CountingBoard';
import { CompareBoard } from './compare/CompareBoard';
import { ArithmeticBoard } from './arithmetic/ArithmeticBoard';

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
  compare: CompareBoard,
  arithmetic: ArithmeticBoard,
};

export function getBoard(gameId: string): ComponentType<BoardProps> {
  const board = boards[gameId];
  if (!board) throw new Error(`Unknown game board: ${gameId}`);
  return board;
}
