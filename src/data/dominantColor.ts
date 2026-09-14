/**
 * Maps an item id to its dominant color (an id from src/data/color.ts), used by the
 * "Theo màu" sort mode. Only items with ONE clearly dominant color are listed —
 * multi-colored/patterned items (tiger, zebra, parrot, panda, giraffe...) are
 * deliberately excluded, since forcing them into a single color bucket would be
 * arbitrary and could look wrong to a child who sees the real photo.
 */
export const DOMINANT_COLOR: Record<string, string> = {
  // fruit
  apple: 'red',
  green_apple: 'green',
  orange: 'orange_color',
  lemon: 'yellow',
  banana: 'yellow',
  grape: 'purple',
  strawberry: 'red',
  blueberry: 'blue',
  cherry: 'red',
  pineapple: 'yellow',
  coconut: 'brown',
  kiwi: 'green',
  avocado: 'green',
  pear: 'green',
  peach: 'orange_color',
  mango: 'orange_color',
  melon: 'green',
  // animal
  pig: 'pink',
  elephant: 'gray',
  frog: 'green',
  fish: 'orange_color',
  crab: 'brown',
  cat: 'gray',
  bear: 'brown',
  owl: 'brown',
  turtle: 'green',
  penguin: 'black',
  monkey: 'brown',
  chicken: 'black',
  cow: 'brown',
  lion: 'brown',
  snake: 'green',
};

export const DOMINANT_COLOR_IDS: string[] = Object.keys(DOMINANT_COLOR);

export function getDominantColor(id: string): string {
  const colorId = DOMINANT_COLOR[id];
  if (!colorId) throw new Error(`No dominant color tagged for item: ${id}`);
  return colorId;
}
