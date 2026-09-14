import type { Item } from './types';

const make = (id: string, vi: string, en: string, swatch: string): Item => ({
  id,
  vi,
  en,
  category: 'color',
  swatch,
});

// The 11 basic colors kids learn first (no mixed/tertiary shades like cyan or teal).
// No photos needed: colors render as a plain swatch, so this category can never
// have a wrong/unclear/cluttered image — it is the most reliable category.
export const color: Item[] = [
  make('red', 'Đỏ', 'Red', '#EF5350'),
  // id "orange_color" (not "orange") to avoid colliding with the "orange" fruit
  // when both categories are drawn from in mix mode — item ids must be globally unique.
  make('orange_color', 'Cam', 'Orange', '#FFA726'),
  make('yellow', 'Vàng', 'Yellow', '#FDD835'),
  make('green', 'Xanh lá', 'Green', '#66BB6A'),
  make('blue', 'Xanh dương', 'Blue', '#42A5F5'),
  make('purple', 'Tím', 'Purple', '#AB47BC'),
  make('pink', 'Hồng', 'Pink', '#EC407A'),
  make('brown', 'Nâu', 'Brown', '#8D6E63'),
  make('black', 'Đen', 'Black', '#212121'),
  make('white', 'Trắng', 'White', '#FFFFFF'),
  make('gray', 'Xám', 'Gray', '#9E9E9E'),
];
