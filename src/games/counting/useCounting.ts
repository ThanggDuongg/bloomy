import { useState } from 'react';
import { SHAPES } from '../shapes';
import { pickChoices } from './pickChoices';
import type { CountingConfig } from './presets';

export interface UseCountingOptions {
  onComplete: () => void;
  rng?: () => number;
}

export interface UseCountingResult {
  round: number;
  totalQuestions: number;
  quantity: number;
  shape: string;
  choices: number[];
  isComplete: boolean;
  /** Returns true and advances the round only on a correct guess. */
  submitAnswer: (value: number) => boolean;
}

interface RoundState {
  round: number;
  quantity: number;
  shape: string;
  choices: number[];
}

/**
 * Picks a number in [1, max] that's never equal to `previous`, without a
 * rejection-sampling loop (a fixed/degenerate rng would otherwise loop forever) —
 * maps rng's output directly onto the max-1 values other than `previous`. Assumes
 * max >= 2, guaranteed by every counting preset's maxNumber (5, 8, or 10).
 */
function pickQuantity(max: number, previous: number | null, rng: () => number): number {
  if (previous === null) return 1 + Math.floor(rng() * max);
  const candidate = 1 + Math.floor(rng() * (max - 1));
  return candidate < previous ? candidate : candidate + 1;
}

function pickRound(
  round: number,
  config: CountingConfig,
  previousQuantity: number | null,
  rng: () => number,
): RoundState {
  const quantity = pickQuantity(config.maxNumber, previousQuantity, rng);
  return {
    round,
    quantity,
    shape: SHAPES[Math.floor(rng() * SHAPES.length)],
    choices: pickChoices(quantity, config.maxNumber, rng),
  };
}

/**
 * Drives one counting session: a sequence of `config.questions` rounds, each asking
 * the player to pick the number matching how many shapes are shown. Advances only on
 * a correct answer; a wrong tap doesn't move the round forward (no penalty).
 */
export function useCounting(
  config: CountingConfig,
  { onComplete, rng = Math.random }: UseCountingOptions,
): UseCountingResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, null, rng));
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = (value: number): boolean => {
    if (isComplete || value !== state.quantity) return false;

    const nextRoundNumber = state.round + 1;
    if (nextRoundNumber >= config.questions) {
      setIsComplete(true);
      onComplete();
    } else {
      setState(pickRound(nextRoundNumber, config, state.quantity, rng));
    }
    return true;
  };

  return {
    round: state.round,
    totalQuestions: config.questions,
    quantity: state.quantity,
    shape: state.shape,
    choices: state.choices,
    isComplete,
    submitAnswer,
  };
}
