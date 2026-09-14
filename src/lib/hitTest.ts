export interface SlotRect {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Finds which slot's rectangle contains the given point, or null if none does. */
export function findMatchingSlot(point: Point, slots: readonly SlotRect[]): string | null {
  for (const slot of slots) {
    const inside =
      point.x >= slot.left && point.x <= slot.right && point.y >= slot.top && point.y <= slot.bottom;
    if (inside) return slot.id;
  }
  return null;
}

/**
 * Extracts a viewport-relative point from a Motion drag-end event, used to hit-test
 * against drop-zone rects (getBoundingClientRect() is also viewport-relative).
 * `info.point` is a documented fallback for gesture types without clientX/Y.
 */
export function eventPoint(
  event: MouseEvent | TouchEvent | PointerEvent,
  fallback: Point,
): Point {
  if ('clientX' in event) return { x: event.clientX, y: event.clientY };
  return fallback;
}
