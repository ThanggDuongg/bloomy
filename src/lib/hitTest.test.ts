import { describe, it, expect } from 'vitest';
import { findMatchingSlot, eventPoint, type SlotRect } from './hitTest';

const slots: SlotRect[] = [
  { id: 'apple', left: 0, right: 100, top: 0, bottom: 100 },
  { id: 'banana', left: 200, right: 300, top: 0, bottom: 100 },
];

describe('findMatchingSlot', () => {
  it('returns the id of the slot containing the point', () => {
    expect(findMatchingSlot({ x: 50, y: 50 }, slots)).toBe('apple');
    expect(findMatchingSlot({ x: 250, y: 50 }, slots)).toBe('banana');
  });

  it('returns null when the point is outside every slot', () => {
    expect(findMatchingSlot({ x: 150, y: 50 }, slots)).toBeNull();
  });

  it('returns null for an empty slot list', () => {
    expect(findMatchingSlot({ x: 50, y: 50 }, [])).toBeNull();
  });

  it('treats slot bounds as inclusive at the edges', () => {
    expect(findMatchingSlot({ x: 0, y: 0 }, slots)).toBe('apple');
    expect(findMatchingSlot({ x: 100, y: 100 }, slots)).toBe('apple');
  });
});

describe('eventPoint', () => {
  it('reads clientX/clientY when present on the event', () => {
    const event = { clientX: 42, clientY: 7 } as unknown as MouseEvent;
    expect(eventPoint(event, { x: 0, y: 0 })).toEqual({ x: 42, y: 7 });
  });

  it('falls back to the given point when clientX is absent', () => {
    const event = {} as MouseEvent;
    expect(eventPoint(event, { x: 5, y: 9 })).toEqual({ x: 5, y: 9 });
  });
});
