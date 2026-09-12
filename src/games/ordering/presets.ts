export interface OrderingConfig {
  /** How many rounds make up one session. */
  questions: number;
  /** How many shapes the player sorts per round. */
  itemCount: number;
  /** Minimum gap between consecutive sorted magnitudes, in [1, 10] — a smaller gap
   *  makes the sizes look more alike, which is harder to compare at a glance. */
  minGap: number;
}

export interface OrderingPreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: OrderingConfig;
}

export const orderingPresets: OrderingPreset[] = [
  { id: 'easy', name: 'Dễ', config: { questions: 5, itemCount: 3, minGap: 3 } },
  { id: 'medium', name: 'Vừa', config: { questions: 6, itemCount: 3, minGap: 2 } },
  { id: 'hard', name: 'Khó', config: { questions: 7, itemCount: 4, minGap: 1 } },
];

export function getOrderingPreset(id: string): OrderingConfig {
  const preset = orderingPresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown ordering preset: ${id}`);
  return preset.config;
}
