import { useState } from 'react';
import { SHAPES } from '../shapes';
import { pickChoices } from './pickChoices';
import type { ArithmeticConfig } from './presets';

export interface UseArithmeticOptions {
  onComplete: () => void;
  rng?: () => number;
}

export interface UseArithmeticResult {
  round: number;
  totalQuestions: number;
  operator: '+' | '-';
  shape: string;
  a: number;
  b: number;
  result: number;
  choices: number[];
  isComplete: boolean;
  /** Returns true and advances the round only when `value` equals the result. */
  submitAnswer: (value: number) => boolean;
}

interface RoundState {
  round: number;
  operator: '+' | '-';
  shape: string;
  a: number;
  b: number;
  result: number;
  choices: number[];
}

function pickRound(round: number, config: ArithmeticConfig, rng: () => number): RoundState {
  const operator: '+' | '-' = rng() < 0.5 ? '+' : '-';
  const shape = SHAPES[Math.floor(rng() * SHAPES.length)];

  let a: number;
  let b: number;
  let result: number;
  if (operator === '+') {
    // a in [1, maxResult-1], b in [1, maxResult-a] so a+b never exceeds maxResult.
    a = 1 + Math.floor(rng() * (config.maxResult - 1));
    b = 1 + Math.floor(rng() * (config.maxResult - a));
    result = a + b;
  } else {
    // a (minuend) in [1, maxResult], b (subtrahend) in [1, a] so a-b is always >= 0.
    a = 1 + Math.floor(rng() * config.maxResult);
    b = 1 + Math.floor(rng() * a);
    result = a - b;
  }

  return {
    round,
    operator,
    shape,
    a,
    b,
    result,
    choices: pickChoices(result, config.maxResult, rng),
  };
}

/**
 * Drives one arithmetic session: a sequence of `config.questions` rounds, each
 * showing two shape groups joined by `+` or `-` and asking the player to pick the
 * result. Advances only on a correct answer; a wrong tap doesn't move the round
 * forward (no penalty).
 */
export function useArithmetic(
  config: ArithmeticConfig,
  { onComplete, rng = Math.random }: UseArithmeticOptions,
): UseArithmeticResult {
  const [state, setState] = useState<RoundState>(() => pickRound(0, config, rng));
  const [isComplete, setIsComplete] = useState(false);

  const submitAnswer = (value: number): boolean => {
    if (isComplete || value !== state.result) return false;

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
    operator: state.operator,
    shape: state.shape,
    a: state.a,
    b: state.b,
    result: state.result,
    choices: state.choices,
    isComplete,
    submitAnswer,
  };
}
