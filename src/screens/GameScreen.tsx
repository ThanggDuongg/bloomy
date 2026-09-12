import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getBoard } from '../games/boards';

interface GameScreenProps {
  gameId: string;
  itemIds: string[];
  modeId?: string;
  presetId?: string;
  /** Bumped by App.tsx on every startRound call; remounts the board for a fresh game. */
  roundKey: number;
  onExit: () => void;
  onBackToSetup: () => void;
  onPlayAgain: () => void;
}

export function GameScreen({
  gameId,
  itemIds,
  modeId,
  presetId,
  roundKey,
  onExit,
  onBackToSetup,
  onPlayAgain,
}: GameScreenProps) {
  const [won, setWon] = useState(false);
  // getBoard looks up an existing component from a static module-level map, it
  // never defines a new one, so identity stays stable across renders for a given
  // gameId — this is a false positive from the "components created during render" rule.
  const Board = useMemo(() => getBoard(gameId), [gameId]);

  return (
    <main className="from-sky-deep to-sky-soft relative flex min-h-screen flex-col bg-gradient-to-b">
      <button
        type="button"
        onClick={onExit}
        className="m-4 self-start rounded-xl bg-white/80 px-4 py-2 font-bold text-earth shadow"
      >
        ← Trang chủ
      </button>

      {/* oxlint-disable-next-line react/static-components -- false positive: Board is
          a stable reference looked up from a static map, not created during render */}
      <Board
        key={roundKey}
        itemIds={itemIds}
        modeId={modeId}
        presetId={presetId}
        onComplete={() => setWon(true)}
      />

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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBackToSetup}
                className="rounded-full bg-white/90 px-5 py-3 font-bold text-earth shadow active:scale-95"
              >
                ⚙️ Đổi độ khó
              </button>
              <button
                type="button"
                onClick={onExit}
                className="rounded-full bg-white/90 px-5 py-3 font-bold text-earth shadow active:scale-95"
              >
                🏠 Trang chủ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
