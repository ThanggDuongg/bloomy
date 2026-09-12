export interface CountingConfig {
  /** Count up to this number (inclusive), e.g. 5. */
  maxNumber: number;
  /** How many rounds make up one session. */
  questions: number;
}

export interface CountingPreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: CountingConfig;
}

export const countingPresets: CountingPreset[] = [
  { id: 'easy', name: 'Dễ', config: { maxNumber: 5, questions: 5 } },
  { id: 'medium', name: 'Vừa', config: { maxNumber: 8, questions: 7 } },
  { id: 'hard', name: 'Khó', config: { maxNumber: 10, questions: 8 } },
];

export function getCountingPreset(id: string): CountingConfig {
  const preset = countingPresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown counting preset: ${id}`);
  return preset.config;
}
