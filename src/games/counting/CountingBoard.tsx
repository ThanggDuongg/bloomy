import { useState } from 'react';
import { motion } from 'motion/react';
import { useCounting } from './useCounting';
import { getCountingPreset } from './presets';
import { useSound } from '../../hooks/useSound';

interface CountingBoardProps {
  presetId?: string;
  onComplete: () => void;
}

const RESPONSIVE_GRID =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(4rem,5rem))] justify-center gap-3 sm:gap-4';

export function CountingBoard({ presetId, onComplete }: CountingBoardProps) {
  const config = getCountingPreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, quantity, shape, choices, submitAnswer } = useCounting(config, {
    onComplete,
  });
  const [wrongPick, setWrongPick] = useState<number | null>(null);

  const handlePick = (value: number) => {
    playClick();
    if (submitAnswer(value)) {
      playSuccess();
      setWrongPick(null);
    } else {
      playError();
      setWrongPick(value);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 p-4 sm:p-6">
      <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
        Câu {round + 1}/{totalQuestions}
      </span>

      <div className={RESPONSIVE_GRID}>
        {Array.from({ length: quantity }, (_, i) => (
          <span key={i} className="text-center text-5xl sm:text-6xl">
            {shape}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {choices.map((value) => (
          <motion.button
            key={value}
            type="button"
            onClick={() => handlePick(value)}
            whileTap={{ scale: 0.9 }}
            animate={wrongPick === value ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sunny text-4xl font-extrabold text-earth shadow-lg sm:h-24 sm:w-24"
          >
            {value}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
