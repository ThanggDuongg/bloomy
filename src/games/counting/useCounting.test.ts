import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCounting } from './useCounting';

const config = { maxNumber: 5, questions: 3 };
const rng = () => 0.5;

describe('useCounting', () => {
  it('starts at round 0 with a quantity and matching choices', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.quantity).toBeGreaterThanOrEqual(1);
    expect(result.current.quantity).toBeLessThanOrEqual(5);
    expect(result.current.choices).toContain(result.current.quantity);
  });

  it('advances to the next round on a correct answer', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    const correct = result.current.quantity;
    act(() => {
      expect(result.current.submitAnswer(correct)).toBe(true);
    });
    expect(result.current.round).toBe(1);
  });

  it('does not advance on a wrong answer', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    const wrong = result.current.choices.find((c) => c !== result.current.quantity)!;
    act(() => {
      expect(result.current.submitAnswer(wrong)).toBe(false);
    });
    expect(result.current.round).toBe(0);
  });

  it('never repeats the immediately previous quantity', () => {
    const { result } = renderHook(() => useCounting(config, { onComplete: vi.fn(), rng }));
    const first = result.current.quantity;
    act(() => {
      result.current.submitAnswer(first);
    });
    expect(result.current.quantity).not.toBe(first);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCounting(config, { onComplete, rng }));
    for (let i = 0; i < config.questions; i++) {
      act(() => {
        result.current.submitAnswer(result.current.quantity);
      });
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
