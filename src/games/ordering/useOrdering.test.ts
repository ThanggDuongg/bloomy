import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useOrdering } from './useOrdering';

const config = { questions: 2, itemCount: 3, minGap: 3 };
const rng = () => 0.5;

function sortedIds(items: { id: string; magnitude: number }[]) {
  return [...items].sort((a, b) => a.magnitude - b.magnitude).map((i) => i.id);
}

describe('useOrdering', () => {
  it('starts at round 0 with itemCount distinct-magnitude items in the tray', () => {
    const { result } = renderHook(() => useOrdering(config, { onComplete: vi.fn(), rng }));
    expect(result.current.round).toBe(0);
    expect(result.current.totalQuestions).toBe(2);
    expect(result.current.items).toHaveLength(3);
    expect(new Set(result.current.items.map((i) => i.magnitude)).size).toBe(3);
  });

  it('marks an item matched and removes it from the tray on a correct-slot drop', () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useOrdering(config, { onComplete: vi.fn(), onMatch, rng }));
    const order = sortedIds(result.current.items);
    const smallestId = order[0];
    act(() => {
      result.current.handleDrop(smallestId, '0');
    });
    expect(result.current.matched.has(smallestId)).toBe(true);
    expect(result.current.items.some((i) => i.id === smallestId)).toBe(false);
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('does not mark matched on a wrong-slot drop and fires onMismatch', () => {
    const onMismatch = vi.fn();
    const { result } = renderHook(() =>
      useOrdering(config, { onComplete: vi.fn(), onMismatch, rng }),
    );
    const order = sortedIds(result.current.items);
    const largestId = order[order.length - 1];
    act(() => {
      result.current.handleDrop(largestId, '0');
    });
    expect(result.current.matched.has(largestId)).toBe(false);
    expect(onMismatch).toHaveBeenCalledTimes(1);
  });

  it('ignores a drop with no target slot', () => {
    const onMatch = vi.fn();
    const onMismatch = vi.fn();
    const { result } = renderHook(() =>
      useOrdering(config, { onComplete: vi.fn(), onMatch, onMismatch, rng }),
    );
    act(() => {
      result.current.handleDrop(result.current.items[0].id, null);
    });
    expect(onMatch).not.toHaveBeenCalled();
    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('advances to the next round once every item in the round is matched correctly', () => {
    const { result } = renderHook(() => useOrdering(config, { onComplete: vi.fn(), rng }));
    for (let slot = 0; slot < config.itemCount; slot++) {
      const order = sortedIds(result.current.items);
      act(() => {
        result.current.handleDrop(order[0], String(slot));
      });
    }
    expect(result.current.round).toBe(1);
    expect(result.current.items).toHaveLength(3);
  });

  it('marks complete and calls onComplete after the last question', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useOrdering(config, { onComplete, rng }));
    for (let q = 0; q < config.questions; q++) {
      for (let slot = 0; slot < config.itemCount; slot++) {
        const order = sortedIds(result.current.items);
        act(() => {
          result.current.handleDrop(order[0], String(slot));
        });
      }
    }
    expect(result.current.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
