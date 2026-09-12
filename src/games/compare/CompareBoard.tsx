import { useState } from 'react';
import { motion } from 'motion/react';
import { useCompare } from './useCompare';
import { getComparePreset } from './presets';
import { useSound } from '../../hooks/useSound';

interface CompareBoardProps {
  presetId?: string;
  onComplete: () => void;
}

function questionLabel(type: 'size' | 'quantity', wantGreater: boolean): string {
  if (type === 'size') return wantGreater ? 'To hơn' : 'Nhỏ hơn';
  return wantGreater ? 'Nhiều hơn' : 'Ít hơn';
}

interface SideContentProps {
  type: 'size' | 'quantity';
  shape: string;
  magnitude: number;
}

function SideContent({ type, shape, magnitude }: SideContentProps) {
  if (type === 'size') {
    // magnitude is 1..10; map linearly onto a 2rem..7rem font size.
    const fontSize = 2 + (magnitude - 1) * (5 / 9);
    return <span style={{ fontSize: `${fontSize}rem` }}>{shape}</span>;
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(2rem,2.5rem))] justify-center gap-1">
      {Array.from({ length: magnitude }, (_, i) => (
        <span key={i} className="text-2xl">
          {shape}
        </span>
      ))}
    </div>
  );
}

export function CompareBoard({ presetId, onComplete }: CompareBoardProps) {
  const config = getComparePreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, type, wantGreater, shape, left, right, submitAnswer } =
    useCompare(config, { onComplete });
  const [wrongSide, setWrongSide] = useState<'left' | 'right' | null>(null);

  const handlePick = (side: 'left' | 'right') => {
    playClick();
    if (submitAnswer(side)) {
      playSuccess();
      setWrongSide(null);
    } else {
      playError();
      setWrongSide(side);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 p-4 sm:p-6">
      <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
        Câu {round + 1}/{totalQuestions}
      </span>
      <h2 className="text-2xl font-extrabold text-earth drop-shadow">
        {questionLabel(type, wantGreater)}
      </h2>

      <div className="flex w-full items-center justify-center gap-6">
        {(['left', 'right'] as const).map((side) => (
          <motion.button
            key={side}
            type="button"
            onClick={() => handlePick(side)}
            whileTap={{ scale: 0.95 }}
            animate={wrongSide === side ? { x: [0, -8, 8, -8, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-40 w-40 flex-1 items-center justify-center rounded-3xl bg-sunny shadow-lg sm:h-48 sm:w-48"
          >
            <SideContent type={type} shape={shape} magnitude={side === 'left' ? left : right} />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
