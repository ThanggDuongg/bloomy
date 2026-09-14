import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSort } from './useSort';
import { getSortMode } from './modes';
import { findMatchingSlot, eventPoint, type SlotRect } from '../../lib/hitTest';
import { getItem } from '../../data';
import { useSound } from '../../hooks/useSound';
import { ItemCard } from '../../components/ItemCard';

interface SortBoardProps {
  itemIds: string[];
  modeId?: string;
  onComplete: () => void;
}

const RESPONSIVE_GRID =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(5.5rem,7rem))] justify-center gap-3 sm:gap-4';

export function SortBoard({ itemIds, modeId, onComplete }: SortBoardProps) {
  const mode = getSortMode(modeId ?? '');
  const { playClick, playSuccess, playError } = useSound();
  const { items, baskets, totalPerBasket, matchedIdsPerBasket, matched, isComplete, handleDrop } =
    useSort(itemIds, mode.basketOf, { onMatch: playSuccess, onMismatch: playError });

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  const basketElements = useRef(new Map<string, HTMLDivElement>());

  const registerBasket = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) basketElements.current.set(key, el);
    else basketElements.current.delete(key);
  }, []);

  const dropOn = useCallback(
    (itemId: string, point: { x: number; y: number }) => {
      const rects: SlotRect[] = [...basketElements.current].map(([id, el]) => {
        const r = el.getBoundingClientRect();
        return { id, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      handleDrop(itemId, findMatchingSlot(point, rects));
    },
    [handleDrop],
  );

  // Items still waiting to be dragged. Once matched, an item is removed from this
  // tray entirely — it doesn't just fade in place — and a little thumbnail of it
  // appears inside its basket instead, like a real drawer: drag it in, it settles
  // there, gone from the tray. Much easier for a toddler to read than a dimmed card.
  const pending = items.filter((id) => !matched.has(id));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 p-4 sm:p-6 md:flex-row md:items-start md:justify-center md:gap-10">
      <section className="flex w-full flex-col items-center gap-3 md:w-1/2">
        <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
          👉 Kéo
        </span>
        <div className={RESPONSIVE_GRID}>
          <AnimatePresence>
            {pending.map((id) => {
              const item = getItem(id);
              return (
                <motion.div
                  key={id}
                  drag
                  dragSnapToOrigin
                  dragElastic={0.2}
                  dragMomentum={false}
                  onDragStart={playClick}
                  onDragEnd={(event, info) => dropOn(id, eventPoint(event, info.point))}
                  onContextMenu={(event) => event.preventDefault()}
                  whileDrag={{ scale: 1.1, zIndex: 20 }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ WebkitTouchCallout: 'none' }}
                  className="aspect-[3/4] w-full cursor-grab rounded-2xl bg-sunny shadow-md select-none active:cursor-grabbing"
                >
                  <ItemCard item={item} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      <section className="flex w-full flex-col items-center gap-3 md:w-1/2">
        <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-bold text-earth">
          🗄️ Ngăn tủ
        </span>
        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-lg">
          {baskets.map((key) => {
            const meta = mode.basketMeta[key];
            const total = totalPerBasket[key] ?? 0;
            const settled = matchedIdsPerBasket[key] ?? [];
            const done = settled.length === total;
            return (
              <div
                key={key}
                ref={(el) => registerBasket(key, el)}
                // The card looks like a drawer front: a solid "handle" header (icon +
                // label + count) sitting above a recessed "compartment" (shadow-inner,
                // darker fill) where settled items visibly pile up.
                className={`overflow-hidden rounded-2xl border-4 shadow-md transition-colors ${
                  done ? 'border-grass' : 'border-earth/30'
                }`}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-3 ${done ? 'bg-grass-soft' : 'bg-sunny'}`}
                >
                  {meta.swatch ? (
                    <div
                      className="h-10 w-10 shrink-0 rounded-full border-2 border-white/80"
                      style={{ backgroundColor: meta.swatch }}
                    />
                  ) : (
                    <span className="text-4xl">{meta.emoji}</span>
                  )}
                  <span className="flex-1 text-lg font-bold text-earth">{meta.name}</span>
                  <span className="text-base font-bold text-earth/70">
                    {settled.length}/{total}
                  </span>
                </div>

                {/* The recessed "inside of the drawer" — always visible, even empty,
                    so the compartment reads as a real container to drop things into. */}
                <div className="min-h-24 bg-earth/10 p-3 shadow-inner">
                  <div className="flex flex-wrap items-center gap-2">
                    <AnimatePresence>
                      {settled.map((id) => (
                        <motion.img
                          key={id}
                          initial={{ scale: 0, opacity: 0, y: -8 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          src={getItem(id).image}
                          alt={getItem(id).vi}
                          className="h-16 w-16 rounded-xl object-cover shadow sm:h-20 sm:w-20"
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
