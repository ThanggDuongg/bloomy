import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useArithmetic } from './useArithmetic';

const config = { questions: 3, maxResult: 5 };
const rng = () => 0.5;

describe('useArithmetic', () => {
  it('starts at round 0 with a result within [0, maxResult] and matching choices', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.result).toBeGreaterThanOrEqual(0);
    expect(result.current.result).toBeLessThanOrEqual(5);
    expect(result.current.choices).toContain(result.current.result);
  });

  it('computes the result consistently with the operator and operands', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    const expected =
      result.current.operator === '+'
        ? result.current.a + result.current.b
        : result.current.a - result.current.b;
    expect(result.current.result).toBe(expected);
  });

  it('never produces a negative subtraction result', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    if (result.current.operator === '-') {
      expect(result.current.a).toBeGreaterThanOrEqual(result.current.b);
    }
  });

  it('advances to the next round on a correct answer', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    const correct = result.current.result;
    act(() => {
      expect(result.current.submitAnswer(correct)).toBe(true);
    });
    expect(result.current.round).toBe(1);
  });

  it('does not advance on a wrong answer', () => {
    const { result } = renderHook(() => useArithmetic(config, { onComplete: vi.fn(), rng }));
    const wrong = result.current.choices.find((c) => c !== result.current.result)!;
    act(() => {
      expect(result.current.submitAnswer(wrong)).toBe(false);
    });
    expect(result.current.round).toBe(0);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useArithmetic(config, { onComplete, rng }));
    for (let i = 0; i < config.questions; i++) {
      act(() => {
        result.current.submitAnswer(result.current.result);
      });
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
