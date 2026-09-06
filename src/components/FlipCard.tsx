import { motion } from 'motion/react';
import type { Item } from '../data/types';
import { ItemCard } from './ItemCard';

interface FlipCardProps {
  item: Item;
  revealed: boolean;
  onClick: () => void;
}

/**
 * A proper two-faced 3D flip card. The face-up side is pre-rotated 180deg and both
 * faces hide their backface, so when the card flips the content reads correctly
 * instead of appearing mirrored.
 */
export function FlipCard({ item, revealed, onClick }: FlipCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.vi}
      className="relative aspect-[3/4] w-full [perspective:1000px] active:scale-95"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Face-down side */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-sunny shadow-md"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-4xl">❓</span>
        </div>
        {/* Face-up side, pre-rotated so it is upright after the flip */}
        <div
          className="absolute inset-0 rounded-2xl bg-sunny shadow-md"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <ItemCard item={item} />
        </div>
      </motion.div>
    </button>
  );
}
