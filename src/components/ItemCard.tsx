import type { Item } from '../data/types';
import { useSettings } from '../hooks/useSettings';

interface ItemCardProps {
  item: Item;
}

/** Face-up content of a card: a uniform square image plus the name(s). */
export function ItemCard({ item }: ItemCardProps) {
  const { showEnglish } = useSettings();

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 p-2 pb-4">
      <div className="w-full flex-1 overflow-hidden rounded-xl">
        <img src={item.image} alt={item.vi} className="h-full w-full object-cover" />
      </div>
      <span className="mt-1 text-xl font-bold text-earth">{item.vi}</span>
      {showEnglish && <span className="text-sm text-earth/70">{item.en}</span>}
    </div>
  );
}
