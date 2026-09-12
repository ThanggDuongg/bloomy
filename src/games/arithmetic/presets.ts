export interface ArithmeticConfig {
  /** How many rounds make up one session. */
  questions: number;
  /** Every round's result stays in [0, maxResult] — capped at a single digit (9) per
   *  the user's explicit call: two-digit results are too hard to read at this age. */
  maxResult: number;
}

export interface ArithmeticPreset {
  id: string;
  /** Vietnamese label shown on the preset button, e.g. "Dễ". */
  name: string;
  config: ArithmeticConfig;
}

export const arithmeticPresets: ArithmeticPreset[] = [
  { id: 'easy', name: 'Dễ', config: { questions: 5, maxResult: 5 } },
  { id: 'medium', name: 'Vừa', config: { questions: 7, maxResult: 7 } },
  { id: 'hard', name: 'Khó', config: { questions: 8, maxResult: 9 } },
];

export function getArithmeticPreset(id: string): ArithmeticConfig {
  const preset = arithmeticPresets.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown arithmetic preset: ${id}`);
  return preset.config;
}
