/**
 * Maps an animal id to its habitat/locomotion group, used by the "Nơi sống" sort
 * mode. Only clearly single-group animals are listed (e.g. not amphibious/ambiguous
 * ones), similar in spirit to dominantColor.ts.
 */
export type Habitat = 'land' | 'water' | 'air';

export const HABITAT: Record<string, Habitat> = {
  // land
  dog: 'land',
  cat: 'land',
  pig: 'land',
  cow: 'land',
  horse: 'land',
  rabbit: 'land',
  elephant: 'land',
  lion: 'land',
  tiger: 'land',
  monkey: 'land',
  giraffe: 'land',
  zebra: 'land',
  bear: 'land',
  panda: 'land',
  snail: 'land',
  turtle: 'land',
  snake: 'land',
  chicken: 'land', // real chickens barely fly — grouped with land animals, not air
  // water
  fish: 'water',
  dolphin: 'water',
  whale: 'water',
  shark: 'water',
  crab: 'water',
  octopus: 'water',
  seahorse: 'water',
  jellyfish: 'water',
  starfish: 'water',
  seal: 'water',
  duck: 'water', // ducks are best known to kids for swimming, not flying
  // air
  bird: 'air',
  owl: 'air',
  parrot: 'air',
  eagle: 'air',
  butterfly: 'air',
  bee: 'air',
  dragonfly: 'air',
  bat: 'air',
};

export const HABITAT_IDS: string[] = Object.keys(HABITAT);

export const HABITAT_META: Record<Habitat, { name: string; emoji: string }> = {
  land: { name: 'Trên cạn', emoji: '🐾' },
  water: { name: 'Dưới nước', emoji: '🐟' },
  air: { name: 'Biết bay', emoji: '🦋' },
};

export function getHabitat(id: string): Habitat {
  const habitat = HABITAT[id];
  if (!habitat) throw new Error(`No habitat tagged for item: ${id}`);
  return habitat;
}
