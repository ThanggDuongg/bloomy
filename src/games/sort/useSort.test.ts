import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSort } from './useSort';

const basketOf = (id: string) => (id === 'apple' || id === 'banana' ? 'fruit' : 'animal');

describe('useSort', () => {
  it('computes baskets present among the drawn items', () => {
    const { result } = renderHook(() => useSort(['apple', 'dog', 'banana'], basketOf));
    expect(new Set(result.current.baskets)).toEqual(new Set(['fruit', 'animal']));
  });

  it('marks an item matched on a correct drop and fires onMatch', () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useSort(['apple', 'dog'], basketOf, { onMatch }));
    act(() => result.current.handleDrop('apple', 'fruit'));
    expect(result.current.matched.has('apple')).toBe(true);
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('does not mark matched on a wrong basket and fires onMismatch', () => {
    const onMismatch = vi.fn();
    const { result } = renderHook(() => useSort(['apple', 'dog'], basketOf, { onMismatch }));
    act(() => result.current.handleDrop('apple', 'animal'));
    expect(result.current.matched.has('apple')).toBe(false);
    expect(onMismatch).toHaveBeenCalledTimes(1);
  });

  it('ignores a drop with no target basket', () => {
    const onMatch = vi.fn();
    const onMismatch = vi.fn();
    const { result } = renderHook(() => useSort(['apple'], basketOf, { onMatch, onMismatch }));
    act(() => result.current.handleDrop('apple', null));
    expect(onMatch).not.toHaveBeenCalled();
    expect(onMismatch).not.toHaveBeenCalled();
  });

  it('tracks matched/total counts per basket', () => {
    const { result } = renderHook(() => useSort(['apple', 'banana', 'dog'], basketOf));
    expect(result.current.totalPerBasket).toEqual({ fruit: 2, animal: 1 });
    act(() => result.current.handleDrop('apple', 'fruit'));
    expect(result.current.matchedPerBasket).toEqual({ fruit: 1 });
  });

  it('tracks which item ids landed in each basket, so the basket can show them', () => {
    const { result } = renderHook(() => useSort(['apple', 'banana', 'dog'], basketOf));
    act(() => result.current.handleDrop('apple', 'fruit'));
    act(() => result.current.handleDrop('dog', 'animal'));
    expect(result.current.matchedIdsPerBasket).toEqual({ fruit: ['apple'], animal: ['dog'] });
  });

  it('reports completion once every item is matched', () => {
    const { result } = renderHook(() => useSort(['apple', 'dog'], basketOf));
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.handleDrop('apple', 'fruit'));
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.handleDrop('dog', 'animal'));
    expect(result.current.isComplete).toBe(true);
  });

  it('shuffles the displayed item order without changing membership', () => {
    const { result } = renderHook(() => useSort(['apple', 'banana', 'dog'], basketOf));
    expect([...result.current.items].sort()).toEqual(['apple', 'banana', 'dog']);
  });
});
