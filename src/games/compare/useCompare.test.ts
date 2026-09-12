import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCompare } from './useCompare';

const config = { questions: 3, minGap: 4 };
const rng = () => 0.5;

function correctSideFor(result: { left: number; right: number; wantGreater: boolean }) {
  return result.left > result.right === result.wantGreater ? 'left' : 'right';
}

describe('useCompare', () => {
  it('starts at round 0 with two magnitudes at least minGap apart', () => {
    const { result } = renderHook(() => useCompare(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(3);
    expect(Math.abs(result.current.left - result.current.right)).toBeGreaterThanOrEqual(4);
  });

  it('advances to the next round when the correct side is tapped', () => {
    const { result } = renderHook(() => useCompare(config, { onComplete: vi.fn(), rng }));
    const correctSide = correctSideFor(result.current);
    act(() => {
      expect(result.current.submitAnswer(correctSide)).toBe(true);
    });
    expect(result.current.round).toBe(1);
  });

  it('does not advance when the wrong side is tapped', () => {
    const { result } = renderHook(() => useCompare(config, { onComplete: vi.fn(), rng }));
    const wrongSide = correctSideFor(result.current) === 'left' ? 'right' : 'left';
    act(() => {
      expect(result.current.submitAnswer(wrongSide)).toBe(false);
    });
    expect(result.current.round).toBe(0);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCompare(config, { onComplete, rng }));
    for (let i = 0; i < config.questions; i++) {
      const correctSide = correctSideFor(result.current);
      act(() => {
        result.current.submitAnswer(correctSide);
      });
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
