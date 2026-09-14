import { color } from '../../data/color';
import { DOMINANT_COLOR_IDS, getDominantColor } from '../../data/dominantColor';
import { HABITAT_IDS, HABITAT_META, getHabitat } from '../../data/habitat';

export interface BasketMeta {
  name: string;
  emoji?: string;
  swatch?: string;
}

export interface SortMode {
  id: string;
  name: string;
  emoji: string;
  /** ALL of these categories must be selected in Setup for this mode to be offered. */
  requiresCategories?: string[];
  /** At least ONE of these categories must be selected for this mode to be offered. */
  requiresAnyCategory?: string[];
  /** Restricts eligible item ids (intersected with the selected categories' pool). */
  itemPool?: readonly string[];
  /** Which basket key an item belongs to under this mode. */
  basketOf: (id: string) => string;
  /** Display info (label + emoji or color swatch) per basket key. */
  basketMeta: Record<string, BasketMeta>;
  /**
   * Caps how many distinct baskets can appear in one round. Only relevant when the
   * number of possible baskets can vary and grow large (e.g. up to 11 colors) —
   * too many baskets on screen at once is overwhelming for a toddler. Omitted =
   * no cap (category/habitat modes naturally stay small: 2 and 3 baskets).
   */
  maxBaskets?: number;
}

const COLOR_BASKET_META: Record<string, BasketMeta> = Object.fromEntries(
  color.map((c) => [c.id, { name: c.vi, swatch: c.swatch }]),
);

export const sortModes: SortMode[] = [
  {
    id: 'habitat',
    name: 'Nơi sống',
    emoji: '🏡',
    requiresAnyCategory: ['animal'],
    itemPool: HABITAT_IDS,
    basketOf: getHabitat,
    basketMeta: HABITAT_META,
  },
  {
    id: 'color',
    name: 'Theo màu',
    emoji: '🎨',
    itemPool: DOMINANT_COLOR_IDS,
    basketOf: getDominantColor,
    basketMeta: COLOR_BASKET_META,
    // Up to 11 colors are tagged, but showing that many drawers at once would be
    // overwhelming — cap a single round to at most 5 colors.
    maxBaskets: 5,
  },
];

export function getSortMode(id: string): SortMode {
  const mode = sortModes.find((m) => m.id === id);
  if (!mode) throw new Error(`Unknown sort mode: ${id}`);
  return mode;
}

/** Sort modes that are valid given the currently selected topic categories. */
export function availableSortModes(selectedCategories: string[]): SortMode[] {
  return sortModes.filter((mode) => {
    if (mode.requiresCategories) {
      return mode.requiresCategories.every((c) => selectedCategories.includes(c));
    }
    if (mode.requiresAnyCategory) {
      return mode.requiresAnyCategory.some((c) => selectedCategories.includes(c));
    }
    return true;
  });
}
