import { useState } from 'react';
import { SHAPES } from '../shapes';
import { pickOther } from './pickOther';
import type { CompareConfig } from './presets';

const MAX_MAGNITUDE = 10;

export interface UseCompareOptions {
  onComplete: () => void;
  rng?: () => number;
}

export interface UseCompareResult {
  round: number;
  totalQuestions: number;
  type: 'size' | 'quantity';
  wantGreater: boolean;
  shape: string;
  left: number;
  right: number;
  isComplete: boolean;
  /** Returns true and advances the round only when `side` is the correct one. */
  submitAnswer: (side: 'left' | 'right') => boolean;
}

interface RoundState {
  round: number;
  type: 'size' | 'quantity';
  wantGreater: boolean;
  shape: string;
  left: number;
  right: number;
  correctSide: 'left' | 'right';
}

function pickRound(round: number, config: CompareConfig, rng: () => number): RoundState {
  const type: 'size' | 'quantity' = rng() < 0.5 ? 'size' : 'quantity';
  const wantGreater = rng() < 0.5;
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];
  const a = 1 + Math.floor(rng() * MAX_MAGNITUDE);
  const b = pickOther(a, config.minGap, MAX_MAGNITUDE, rng);
  const swap = rng() < 0.5;
  const left = swap ? b : a;
  const right = swap ? a : b;
  const correctSide: 'left' | 'right' = wantGreater === left > right ? 'left' : 'right';
  return { round, type, wantGreater, shape, left, right, correctSide };
}

/**
 * Drives one compare session: a sequence of `config.questions` rounds, each asking
 * the player to pick the side matching a randomly chosen comparison ("to hơn" /
 * "nhỏ hơn" / "nhiều hơn" / "ít hơn"). Advances only on a correct tap; a wrong tap
 * doesn't move the round forward (no penalty).
 */
export function useCompare(
  config: CompareConfig,
  { onComplete, rng = Math.random }: UseCompareOptions,
): UseCompareResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, rng));
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = (side: 'left' | 'right'): boolean => {
    if (isComplete || side !== state.correctSide) return false;

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
    type: state.type,
    wantGreater: state.wantGreater,
    shape: state.shape,
    left: state.left,
    right: state.right,
    isComplete,
    submitAnswer,
  };
}
