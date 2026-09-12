import { useState } from 'react';
import { motion } from 'motion/react';
import { useArithmetic } from './useArithmetic';
import { getArithmeticPreset } from './presets';
import { useSound } from '../../hooks/useSound';

interface ArithmeticBoardProps {
  presetId?: string;
  onComplete: () => void;
}

function ShapeGroup({ shape, count }: { shape: string; count: number }) {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(2rem,2.5rem))] justify-center gap-1 p-3">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="text-center text-2xl">
          {shape}
        </span>
      ))}
    </div>
  );
}

export function ArithmeticBoard({ presetId, onComplete }: ArithmeticBoardProps) {
  const config = getArithmeticPreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, operator, shape, a, b, choices, submitAnswer } = useArithmetic(
    config,
    { onComplete },
  );
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

      <div className="flex w-full items-center justify-center gap-3 sm:gap-4">
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-sunny shadow-lg sm:h-36 sm:w-36">
          <ShapeGroup shape={shape} count={a} />
        </div>
        <span className="text-4xl font-extrabold text-earth">{operator}</span>
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-sunny shadow-lg sm:h-36 sm:w-36">
          <ShapeGroup shape={shape} count={b} />
        </div>
        <span className="text-4xl font-extrabold text-earth">=</span>
        <span className="text-4xl font-extrabold text-earth">?</span>
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
