import type { Item } from '../data/types';
import { useSettings } from '../hooks/useSettings';

interface ItemCardProps {
  item: Item;
}

/** Face-up content of a card: a uniform square image (or color swatch) plus the name(s). */
export function ItemCard({ item }: ItemCardProps) {
  const { showEnglish } = useSettings();

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 p-2 pb-4">
      <div className="w-full flex-1 overflow-hidden rounded-xl">
        {item.swatch ? (
          <div
            className="h-full w-full rounded-xl border-4 border-white/60"
            style={{ backgroundColor: item.swatch }}
          />
        ) : (
          // draggable=false so this component stays safe to use inside a drag
          // gesture (e.g. Shadow Match) — otherwise native image drag hijacks the
          // pointer gesture before Motion's own drag handling sees it.
          <img
            src={item.image}
            alt={item.vi}
            draggable={false}
            className="h-full w-full object-cover select-none"
          />
        )}
      </div>
      <span className="mt-1 text-xl font-bold text-earth">{item.vi}</span>
      {showEnglish && <span className="text-sm text-earth/70">{item.en}</span>}
    </div>
  );
}
