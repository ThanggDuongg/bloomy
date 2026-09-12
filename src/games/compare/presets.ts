export interface CompareConfig {
  /** How many rounds make up one session. */
  questions: number;
  /** Minimum gap between the two rounds' magnitudes, in [1, 10] — a smaller gap
   *  makes the two options look more alike, which is harder to tell apart. */
  minGap: number;
}

export interface ComparePreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: CompareConfig;
}

export const comparePresets: ComparePreset[] = [
  { id: 'easy', name: 'Dễ', config: { questions: 5, minGap: 4 } },
  { id: 'medium', name: 'Vừa', config: { questions: 7, minGap: 2 } },
  { id: 'hard', name: 'Khó', config: { questions: 8, minGap: 1 } },
];

export function getComparePreset(id: string): CompareConfig {
  const preset = comparePresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown compare preset: ${id}`);
  return preset.config;
}
