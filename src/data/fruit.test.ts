import { describe, it, expect } from 'vitest';
import { fruit } from './fruit';

describe('fruit data', () => {
  it('has at least 10 items so rounds stay varied', () => {
    expect(fruit.length).toBeGreaterThanOrEqual(10);
  });

  it('has unique ids', () => {
    const ids = fruit.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has vi, en and a webp image path in the fruit folder', () => {
    for (const item of fruit) {
      expect(item.vi.length).toBeGreaterThan(0);
      expect(item.en.length).toBeGreaterThan(0);
      expect(item.category).toBe('fruit');
      expect(item.image).toMatch(/^\/images\/fruit\/.+\.webp$/);
    }
  });
});
