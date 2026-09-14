import { describe, it, expect } from 'vitest';
import { allItems } from './index';

describe('allItems', () => {
  it('has globally unique ids across every category', () => {
    // Item ids double as bag/deck identifiers and must stay unique even when
    // multiple categories are mixed into one round; a duplicate id would make
    // getItem() resolve to the wrong item's name/image.
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has either an image or a swatch', () => {
    for (const item of allItems) {
      expect(item.image ?? item.swatch).toBeTruthy();
    }
  });
});
