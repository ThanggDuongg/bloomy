import { useEffect } from 'react';
import { useMemoryMatch } from './useMemoryMatch';
import { useBoardLayout } from './useBoardLayout';
import { getItem } from '../../data';
import { FlipCard } from '../../components/FlipCard';
import { useSound } from '../../hooks/useSound';

interface MemoryMatchBoardProps {
  itemIds: string[];
  onComplete: () => void;
}

export function MemoryMatchBoard({ itemIds, onComplete }: MemoryMatchBoardProps) {
  const { playClick, playSuccess, playError } = useSound();
  const { cards, revealed, matched, isComplete, flip } = useMemoryMatch(itemIds, {
    onMatch: playSuccess,
    onMismatch: playError,
  });
  const { ref, columns, cardWidth } = useBoardLayout(cards.length);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  return (
    <div className="w-full p-4 sm:p-6">
      <div ref={ref} className="flex w-full justify-center">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)`, gap: 16 }}
        >
          {cards.map((card) => {
            const isUp = revealed.has(card.key) || matched.has(card.itemId);
            return (
              <FlipCard
                key={card.key}
                item={getItem(card.itemId)}
                revealed={isUp}
                onClick={() => {
                  playClick();
                  flip(card.key);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
