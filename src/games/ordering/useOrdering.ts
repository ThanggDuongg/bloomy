import { useState } from 'react';
import { shuffle } from '../../lib/shuffle';
import { SHAPES } from '../shapes';
import { pickMagnitudes } from './pickMagnitudes';
import type { OrderingConfig } from './presets';

const MAX_MAGNITUDE = 10;

export interface Item {
  id: string;
  magnitude: number;
}

export interface UseOrderingOptions {
  onComplete: () => void;
  onMatch?: () => void;
  onMismatch?: () => void;
  rng?: () => number;
}

export interface UseOrderingResult {
  round: number;
  totalQuestions: number;
  shape: string;
  itemCount: number;
  /** Items still unmatched — i.e. still in the tray — for the current round. */
  items: Item[];
  matched: Set<string>;
  isComplete: boolean;
  /** `targetSlot` is a decimal-string slot id ("0", "1", ...), or null if the drop
   *  landed on no slot. Only a drop on the item's correct slot counts. */
  handleDrop: (itemId: string, targetSlot: string | null) => void;
}

interface RoundState {
  round: number;
  shape: string;
  items: Item[];
  rankById: Record<string, number>;
}

function pickRound(round: number, config: OrderingConfig, rng: () => number): RoundState {
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
  const magnitudes = pickMagnitudes(config.itemCount, config.minGap, MAX_MAGNITUDE, rng);
  const ids = magnitudes.map((_, i) => `item-${i}`);
  const rankById: Record<string, number> = {};
  ids.forEach((id, i) => {
    rankById[id] = i;
  });
  const items = shuffle(
    ids.map((id, i) => ({ id, magnitude: magnitudes[i] })),
    rng,
  );
  return { round, shape, items, rankById };
}

/**
 * Drives one ordering session: a sequence of `config.questions` rounds, each asking
 * the player to drag `config.itemCount` differently sized shapes into slots ordered
 * smallest to largest. A round completes once every item is dropped on its correct
 * slot; a wrong-slot drop is a no-op (no penalty, item stays in the tray).
 */
export function useOrdering(
  config: OrderingConfig,
  { onComplete, onMatch, onMismatch, rng = Math.random }: UseOrderingOptions,
): UseOrderingResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, rng));
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const handleDrop = (itemId: string, targetSlot: string | null) => {
    if (targetSlot === null) return;
    if (String(state.rankById[itemId]) !== targetSlot) {
      onMismatch?.();
      return;
    }

    onMatch?.();
    const nextMatched = new Set(matched).add(itemId);
    if (nextMatched.size < config.itemCount) {
      setMatched(nextMatched);
      return;
    }

    const nextRoundNumber = state.round + 1;
    if (nextRoundNumber >= config.questions) {
      setIsComplete(true);
      onComplete();
    } else {
      setState(pickRound(nextRoundNumber, config, rng));
      setMatched(new Set());
    }
  };

  return {
    round: state.round,
    totalQuestions: config.questions,
    shape: state.shape,
    itemCount: config.itemCount,
    items: state.items.filter((item) => !matched.has(item.id)),
    matched,
    isComplete,
    handleDrop,
  };
}
