import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryMatchBoard } from '../games/memory-match/MemoryMatchBoard';

interface GameScreenProps {
  itemIds: string[];
  onExit: () => void;
  onPlayAgain: () => void;
}

export function GameScreen({ itemIds, onExit, onPlayAgain }: GameScreenProps) {
  const [won, setWon] = useState(false);
  // Re-key the board so Play-again rebuilds a fresh deck.
  const boardKey = useMemo(() => itemIds.join('-'), [itemIds]);

  return (
    <main className="from-sky-deep to-sky-soft relative flex min-h-screen flex-col bg-gradient-to-b">
      <button
        type="button"
        onClick={onExit}
        className="m-4 self-start rounded-xl bg-white/80 px-4 py-2 font-bold text-earth shadow"
      >
        ← Trang chủ
      </button>

      <MemoryMatchBoard key={boardKey} itemIds={itemIds} onComplete={() => setWon(true)} />

      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/40"
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-7xl">
              🎉
            </motion.div>
            <button
              type="button"
              onClick={() => {
                setWon(false);
                onPlayAgain();
              }}
              className="rounded-full bg-sunny px-8 py-4 text-2xl font-extrabold text-earth shadow-lg active:scale-95"
            >
              Chơi lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
