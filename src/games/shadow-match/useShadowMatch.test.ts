import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useShadowMatch } from './useShadowMatch';

describe('useShadowMatch', () => {
  it('marks an item matched on a correct drop and fires onMatch', () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useShadowMatch(['apple', 'banana'], { onMatch }));

    act(() => {
      result.current.handleDrop('apple', 'apple');
    });

    expect(result.current.matched.has('apple')).toBe(true);
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('does not mark matched on a wrong drop and fires onMismatch', () => {
    const onMismatch = vi.fn();
    const { result } = renderHook(() => useShadowMatch(['apple', 'banana'], { onMismatch }));

    act(() => {
      result.current.handleDrop('apple', 'banana');
    });

    expect(result.current.matched.has('apple')).toBe(false);
    expect(onMismatch).toHaveBeenCalledTimes(1);
  });

  it('ignores a drop with no target slot (dropped outside any slot)', () => {
    const onMatch = vi.fn();
    const onMismatch = vi.fn();
    const { result } = renderHook(() => useShadowMatch(['apple', 'banana'], { onMatch, onMismatch }));

    act(() => {
      result.current.handleDrop('apple', null);
    });

    expect(result.current.matched.has('apple')).toBe(false);
    expect(onMatch).not.toHaveBeenCalled();
    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('reports completion once every item is matched', () => {
    const { result } = renderHook(() => useShadowMatch(['apple', 'banana']));

    expect(result.current.isComplete).toBe(false);
    act(() => result.current.handleDrop('apple', 'apple'));
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.handleDrop('banana', 'banana'));
    expect(result.current.isComplete).toBe(true);
  });
});
