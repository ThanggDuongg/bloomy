import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useShadowMatch } from './useShadowMatch';
import { findMatchingSlot, eventPoint, type SlotRect } from '../../lib/hitTest';
import { getItem } from '../../data';
import { useSound } from '../../hooks/useSound';
import { ItemCard } from '../../components/ItemCard';

interface ShadowMatchBoardProps {
  itemIds: string[];
  onComplete: () => void;
}

// CSS grid columns that self-adjust to the container's width via auto-fill: each
// column is 5.5-7rem wide and the browser fits as many as the screen allows —
// this scales from a narrow phone (few columns) up to a wide desktop (many
// columns) with no JS layout measurement needed.
const RESPONSIVE_GRID =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(5.5rem,7rem))] justify-center gap-3 sm:gap-4';

export function ShadowMatchBoard({ itemIds, onComplete }: ShadowMatchBoardProps) {
  const { playClick, playSuccess, playError } = useSound();
  const { items, slots, matched, isComplete, handleDrop } = useShadowMatch(itemIds, {
    onMatch: playSuccess,
    onMismatch: playError,
  });

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 p-4 sm:p-6 md:flex-row md:items-start md:justify-center md:gap-10">
      <section className="flex w-full flex-col items-center gap-3 md:w-1/2">
        <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
          👉 Kéo
        </span>
        <div className={RESPONSIVE_GRID}>
          {items.map((id) => {
            const item = getItem(id);
            const done = matched.has(id);
            return (
              <motion.div
                key={id}
                drag={!done}
                dragSnapToOrigin
                dragElastic={0.2}
                dragMomentum={false}
                onDragStart={playClick}
                onDragEnd={(event, info) => dropOn(id, eventPoint(event, info.point))}
                onContextMenu={(event) => event.preventDefault()}
                whileDrag={{ scale: 1.1, zIndex: 20 }}
                style={{ WebkitTouchCallout: 'none' }}
                className={`aspect-[3/4] w-full rounded-2xl bg-sunny shadow-md select-none ${
                  done ? 'pointer-events-none opacity-30' : 'cursor-grab active:cursor-grabbing'
                }`}
              >
                <ItemCard item={item} />
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="flex w-full flex-col items-center gap-3 md:w-1/2">
        <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
          🎯 Thả vào đây
        </span>
        <div className={RESPONSIVE_GRID}>
          {slots.map((id) => {
            const item = getItem(id);
            const done = matched.has(id);
            // Before a match: a transparent-background silhouette icon, blackened by
            // the filter so its outline shape is visible (the real photo can't be
            // used here — its opaque background would just turn solid black).
            // After a match: reveal the real, colorful photo as the reward.
            const src = done ? item.image : `/images/silhouette/${id}.webp`;
            const filter = done ? undefined : 'brightness(0)';
            return (
              <div
                key={id}
                ref={(el) => registerSlot(id, el)}
                // Same aspect ratio as the item card (aspect-[3/4]) so both columns
                // are the same height; the icon just sits centered inside via flex,
                // no extra decoration in the empty space above/below it.
                className={`flex aspect-[3/4] w-full items-center justify-center rounded-2xl border-4 transition-colors ${
                  done ? 'border-grass bg-grass-soft' : 'border-earth/30 border-dashed bg-white/40'
                }`}
              >
                <img
                  src={src}
                  alt={done ? item.vi : ''}
                  aria-hidden={!done}
                  className="h-4/5 w-4/5 object-contain"
                  style={{ filter }}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
