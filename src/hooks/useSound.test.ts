import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSound } from './useSound';

describe('useSound', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  it('exposes play functions that do not throw', () => {
    const { result } = renderHook(() => useSound());
    expect(() => result.current.playClick()).not.toThrow();
    expect(() => result.current.playSuccess()).not.toThrow();
    expect(() => result.current.playError()).not.toThrow();
  });
});
