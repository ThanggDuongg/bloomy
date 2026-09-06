import type { Item } from './types';

const make = (id: string, vi: string, en: string): Item => ({
  id,
  vi,
  en,
  category: 'fruit',
  image: `/images/fruit/${id}.webp`,
});

export const fruit: Item[] = [
  // Common fruits (also available as Fluent 3D / emoji as a fallback)
  make('apple', 'Táo', 'Apple'),
  make('green_apple', 'Táo xanh', 'Green apple'),
  make('pear', 'Lê', 'Pear'),
  make('orange', 'Cam', 'Orange'),
  make('lemon', 'Chanh', 'Lemon'),
  make('banana', 'Chuối', 'Banana'),
  make('watermelon', 'Dưa hấu', 'Watermelon'),
  make('melon', 'Dưa lưới', 'Melon'),
  make('grape', 'Nho', 'Grape'),
  make('strawberry', 'Dâu tây', 'Strawberry'),
  make('blueberry', 'Việt quất', 'Blueberry'),
  make('cherry', 'Anh đào', 'Cherry'),
  make('peach', 'Đào', 'Peach'),
  make('mango', 'Xoài', 'Mango'),
  make('pineapple', 'Dứa', 'Pineapple'),
  make('coconut', 'Dừa', 'Coconut'),
  make('kiwi', 'Kiwi', 'Kiwi'),
  make('avocado', 'Bơ', 'Avocado'),
  // Vietnamese fruits with no emoji (photo only)
  make('durian', 'Sầu riêng', 'Durian'),
  make('dragonfruit', 'Thanh long', 'Dragon fruit'),
  make('rambutan', 'Chôm chôm', 'Rambutan'),
  make('lychee', 'Vải', 'Lychee'),
  make('longan', 'Nhãn', 'Longan'),
  make('jackfruit', 'Mít', 'Jackfruit'),
  make('guava', 'Ổi', 'Guava'),
  make('papaya', 'Đu đủ', 'Papaya'),
  make('pomelo', 'Bưởi', 'Pomelo'),
  make('starfruit', 'Khế', 'Star fruit'),
  make('custard_apple', 'Mãng cầu', 'Custard apple'),
  make('persimmon', 'Hồng', 'Persimmon'),
];
