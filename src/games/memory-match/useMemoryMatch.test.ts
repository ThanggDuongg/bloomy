import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMemoryMatch } from './useMemoryMatch';

describe('useMemoryMatch', () => {
  it('marks a matching pair as matched and fires onMatch', () => {
    const onMatch = vi.fn();
    const { result } = renderHook(() => useMemoryMatch(['apple', 'banana'], { onMatch }));
    const appleCards = result.current.cards.filter((c) => c.itemId === 'apple');

    act(() => result.current.flip(appleCards[0].key));
    act(() => result.current.flip(appleCards[1].key));

    expect(result.current.matched.has('apple')).toBe(true);
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('does not match two different items and fires onMismatch', () => {
    const onMismatch = vi.fn();
    const { result } = renderHook(() => useMemoryMatch(['apple', 'banana'], { onMismatch }));
    const apple = result.current.cards.find((c) => c.itemId === 'apple')!;
    const banana = result.current.cards.find((c) => c.itemId === 'banana')!;

    act(() => result.current.flip(apple.key));
    act(() => result.current.flip(banana.key));

    expect(result.current.matched.has('apple')).toBe(false);
    expect(result.current.matched.has('banana')).toBe(false);
    expect(onMismatch).toHaveBeenCalledTimes(1);
  });
});
