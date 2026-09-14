import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrdering } from './useOrdering';
import { getOrderingPreset } from './presets';
import { findMatchingSlot, eventPoint, type SlotRect } from '../../lib/hitTest';
import { useSound } from '../../hooks/useSound';

interface OrderingBoardProps {
  presetId?: string;
  onComplete: () => void;
}

function magnitudeFontSize(magnitude: number): string {
  // magnitude is 1..10; map linearly onto a 2rem..5rem font size (smaller ceiling
  // than the compare game's 7rem since up to 4 of these sit side by side in a tray).
  return `${2 + (magnitude - 1) * (3 / 9)}rem`;
}

export function OrderingBoard({ presetId, onComplete }: OrderingBoardProps) {
  const config = getOrderingPreset(presetId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { round, totalQuestions, shape, itemCount, items, settledBySlot, handleDrop } =
    useOrdering(config, {
      onComplete,
      onMatch: playSuccess,
      onMismatch: playError,
    });

  const slotElements = useRef(new Map<string, HTMLDivElement>());

  const registerSlot = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) slotElements.current.set(id, el);
    else slotElements.current.delete(id);
  }, []);

  const dropOn = useCallback(
    (itemId: string, point: { x: number; y: number }) => {
      const rects: SlotRect[] = [...slotElements.current].map(([id, el]) => {
        const r = el.getBoundingClientRect();
        return { id, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      handleDrop(itemId, findMatchingSlot(point, rects));
    },
    [handleDrop],
  );

  const slotIds = Array.from({ length: itemCount }, (_, i) => String(i));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 p-4 sm:p-6">
      <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
        Câu {round + 1}/{totalQuestions}
      </span>
      <span className="text-lg font-bold text-earth">Nhỏ nhất → Lớn nhất</span>

      <div className="flex w-full items-end justify-center gap-3 sm:gap-4">
        {slotIds.map((id) => {
          const settled = settledBySlot[id];
          return (
            <div
              key={id}
              ref={(el) => registerSlot(id, el)}
              className={`flex h-24 w-20 items-center justify-center rounded-2xl border-4 sm:h-28 sm:w-24 ${
                settled ? 'border-grass bg-grass-soft' : 'border-dashed border-earth/30 bg-white/40'
              }`}
            >
              {settled && (
                <span style={{ fontSize: magnitudeFontSize(settled.magnitude) }}>{shape}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              drag
              dragSnapToOrigin
              dragElastic={0.2}
              dragMomentum={false}
              onDragStart={playClick}
              onDragEnd={(event, info) => dropOn(item.id, eventPoint(event, info.point))}
              onContextMenu={(event) => event.preventDefault()}
              whileDrag={{ scale: 1.1, zIndex: 20 }}
              exit={{ scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ WebkitTouchCallout: 'none' }}
              className="flex h-24 w-20 cursor-grab items-center justify-center rounded-2xl bg-sunny shadow-md select-none active:cursor-grabbing sm:h-28 sm:w-24"
            >
              <span style={{ fontSize: magnitudeFontSize(item.magnitude) }}>{shape}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
