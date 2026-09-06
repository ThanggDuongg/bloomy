import type { Item } from './types';
import { fruit } from './fruit';
import { animal } from './animal';

export type { Item };

export const categories: Record<string, Item[]> = { fruit, animal };

export interface CategoryMeta {
  id: string;
  /** Vietnamese display name. */
  name: string;
  emoji: string;
}

// Order shown in the category picker.
export const categoryList: CategoryMeta[] = [
  { id: 'fruit', name: 'Trái cây', emoji: '🍓' },
  { id: 'animal', name: 'Động vật', emoji: '🐶' },
];

export const allItems: Item[] = Object.values(categories).flat();

export function getCategory(name: string): Item[] {
  const items = categories[name];
  if (!items) throw new Error(`Unknown category: ${name}`);
  return items;
}

export function getItem(id: string): Item {
  const item = allItems.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}
