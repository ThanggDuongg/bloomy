import { SILHOUETTE_IDS, getShapeGroup } from '../data/silhouetteAssets';
import { sortModes, type SortMode } from './sort/modes';
import { countingPresets } from './counting/presets';
import { comparePresets } from './compare/presets';
import { arithmeticPresets } from './arithmetic/presets';
import { orderingPresets } from './ordering/presets';

export interface GameMeta {
  id: string;
  /** Vietnamese display name shown in the home menu. */
  name: string;
  emoji: string;
  minCount: number;
  maxCount: number;
  defaultCount: number;
  /** Word shown after the count in the difficulty slider, e.g. "cặp" or "món". */
  unitLabel?: string;
  /** Restricts which categories can be picked in Setup. Omitted = all categories allowed. */
  allowedCategories?: string[];
  /**
   * Restricts which item ids can be drawn, beyond category membership — for games
   * that need a specific asset per item (e.g. shadow match needs a silhouette icon,
   * which isn't available for every item). Omitted = every item in the selected
   * categories is eligible.
   */
  itemPool?: readonly string[];
  /**
   * Maps an item id to a "shape group" key; at most one id per group is drawn into
   * a single round, so visually similar/near-identical items (e.g. apple vs
   * green_apple) never appear side by side in the same round. Omitted = no such
   * constraint (every id is free to co-occur with any other).
   */
  groupOf?: (id: string) => string;
  /**
   * Sub-modes the player picks between in Setup (e.g. sort "Theo loại" vs "Theo
   * màu"), each with its own category requirements/item pool/basket logic. Omitted
   * for games that don't have modes.
   */
  sortModes?: SortMode[];
  /**
   * When true, Setup's category chips act as a single-select (picking one clears
   * any other) instead of the usual multi-select "mix categories" toggle.
   */
  singleCategory?: boolean;
  /**
   * When true, Setup skips the "Chủ đề" category section entirely — this game
   * doesn't draw from fruit/animal/color data (e.g. it generates its own content).
   */
  noCategories?: boolean;
  /**
   * Fixed named difficulty presets (e.g. Dễ/Vừa/Khó) shown as buttons instead of the
   * numeric DifficultySelector slider — for games where difficulty isn't a single
   * linear quantity. `config` is opaque here; each game reads its own preset config
   * directly from its own module by id (see games/counting/presets.ts).
   */
  presets?: { id: string; name: string; config: unknown }[];
}

// The catalogue of games shown on the home menu. Add a new entry here (and wire its
// board in games/boards.tsx) to grow the menu.
export const games: GameMeta[] = [
  { id: 'memory-match', name: 'Lật hình', emoji: '🎴', minCount: 3, maxCount: 10, defaultCount: 6 },
  {
    id: 'shadow-match',
    name: 'Bóng ai đây?',
    emoji: '❓',
    minCount: 3,
    maxCount: 8,
    defaultCount: 5,
    // Shadows are silhouettes of real photos; a flat color swatch has no
    // distinctive shape, so the color category is excluded here.
    allowedCategories: ['fruit', 'animal'],
    // Only items with a generated silhouette icon are eligible (see silhouetteAssets.ts).
    itemPool: SILHOUETTE_IDS,
    // Never draw two look-alike silhouettes (e.g. apple + green_apple) in one round.
    groupOf: getShapeGroup,
  },
  {
    id: 'sort',
    name: 'Phân loại',
    emoji: '🧺',
    minCount: 4,
    maxCount: 10,
    defaultCount: 6,
    unitLabel: 'món',
    // Color swatches have no category/habitat/dominant-color of their own to sort
    // by, so they're excluded from this game entirely.
    allowedCategories: ['fruit', 'animal'],
    // Fruit and animal never mix in this game — pick one topic, then a mode.
    singleCategory: true,
    sortModes,
  },
  {
    id: 'counting',
    name: 'Đếm số lượng',
    emoji: '🔢',
    // Difficulty here sets two coupled values (max number + question count) via
    // `presets` below, not a single linear count — these three fields are still
    // required by GameMeta but unused for this game.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: countingPresets,
  },
  {
    id: 'compare',
    name: 'So sánh',
    emoji: '⚖️',
    // Same reasoning as the counting game: presets replace the numeric slider, so
    // these three fields are required by GameMeta but unused here.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: comparePresets,
  },
  {
    id: 'arithmetic',
    name: 'Cộng trừ',
    emoji: '➕',
    // Same reasoning as counting/compare: presets replace the numeric slider, so
    // these three fields are required by GameMeta but unused here.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: arithmeticPresets,
  },
  {
    id: 'ordering',
    name: 'Sắp xếp kích thước',
    emoji: '📏',
    // Same reasoning as counting/compare/arithmetic: presets replace the numeric
    // slider, so these three fields are required by GameMeta but unused here.
    minCount: 0,
    maxCount: 0,
    defaultCount: 0,
    noCategories: true,
    presets: orderingPresets,
  },
];

export function getGame(id: string): GameMeta {
  const game = games.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game: ${id}`);
  return game;
}
