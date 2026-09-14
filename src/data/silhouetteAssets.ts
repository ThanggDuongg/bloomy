/**
 * Maps item ids to a Microsoft Fluent Emoji asset folder, used to generate a
 * transparent silhouette-friendly icon for the "shadow match" game.
 *
 * Why a separate asset set: the fruit/animal photos used elsewhere (Pexels stock
 * photos) have opaque rectangular backgrounds, so blackening them with a CSS filter
 * blackens the whole rectangle instead of revealing a recognizable outline. Fluent
 * Emoji icons are transparent PNGs, so the same filter produces a real silhouette
 * shape. Only items with a clear, simple Fluent equivalent are listed here — exotic
 * items with no such icon (e.g. durian, jellyfish) are excluded from this game.
 *
 * Animals whose only Fluent asset is a "face" icon (bear, panda) are excluded
 * entirely, since a round head + two ears is indistinguishable from other face icons
 * regardless of which other items happen to be drawn alongside it.
 */
export const SILHOUETTE_FLUENT_FOLDER: Record<string, string> = {
  // fruit
  apple: 'Red apple',
  green_apple: 'Green apple',
  pear: 'Pear',
  orange: 'Tangerine',
  lemon: 'Lemon',
  banana: 'Banana',
  watermelon: 'Watermelon',
  melon: 'Melon',
  grape: 'Grapes',
  strawberry: 'Strawberry',
  blueberry: 'Blueberries',
  cherry: 'Cherries',
  peach: 'Peach',
  mango: 'Mango',
  pineapple: 'Pineapple',
  coconut: 'Coconut',
  kiwi: 'Kiwi fruit',
  avocado: 'Avocado',
  // animal — full-body icons (not "face" variants): face icons are all a similar
  // rounded-square-with-ears blob, too similar in outline to tell apart by shape.
  // Full-body poses (curled tail, mane, standing stance...) are much more distinct.
  dog: 'Dog',
  cat: 'Cat',
  chicken: 'Chicken',
  duck: 'Duck',
  pig: 'Pig',
  cow: 'Cow',
  horse: 'Horse',
  rabbit: 'Rabbit',
  elephant: 'Elephant',
  lion: 'Lion',
  tiger: 'Tiger',
  monkey: 'Monkey',
  bird: 'Bird',
  fish: 'Fish',
  frog: 'Frog',
  giraffe: 'Giraffe',
  zebra: 'Zebra',
  butterfly: 'Butterfly',
  snail: 'Snail',
  turtle: 'Turtle',
  snake: 'Snake',
  owl: 'Owl',
  parrot: 'Parrot',
  penguin: 'Penguin',
};

export const SILHOUETTE_IDS: string[] = Object.keys(SILHOUETTE_FLUENT_FOLDER);

/**
 * Groups items whose silhouette is practically indistinguishable from another's
 * (e.g. apple/green_apple share the literal same outline; kiwi/coconut/orange/melon
 * are all just a plain circle once blackened). At most one item per group is drawn
 * into a single round — across different rounds any of them can still appear, so
 * content variety isn't lost, but a round never puts two look-alike shadows side by
 * side. Items not listed here are assumed visually unique and get their own
 * implicit group (see getShapeGroup).
 */
const SHAPE_GROUP: Record<string, string> = {
  apple: 'round-fruit',
  green_apple: 'round-fruit',
  orange: 'round-fruit',
  lemon: 'round-fruit',
  melon: 'round-fruit',
  peach: 'round-fruit',
  mango: 'round-fruit',
  kiwi: 'round-fruit',
  coconut: 'round-fruit',
};

export function getShapeGroup(id: string): string {
  return SHAPE_GROUP[id] ?? id;
}
