import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildShadowRound } from './round';

interface ShadowMatchOptions {
  onMatch?: () => void;
  onMismatch?: () => void;
}

export function useShadowMatch(itemIds: string[], options: ShadowMatchOptions = {}) {
  const round = useMemo(() => buildShadowRound(itemIds), [itemIds]);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  /**
   * Called when an item is dropped. `targetSlotId` is the id of the shadow slot the
   * pointer landed on (from the hit-test), or null if it was dropped outside every slot.
   */
  const handleDrop = useCallback((itemId: string, targetSlotId: string | null) => {
    if (targetSlotId === null) return;
    if (targetSlotId === itemId) {
      setMatched((m) => new Set(m).add(itemId));
      optionsRef.current.onMatch?.();
    } else {
      optionsRef.current.onMismatch?.();
    }
  }, []);

  const isComplete = matched.size === itemIds.length && itemIds.length > 0;

  return { items: round.items, slots: round.slots, matched, isComplete, handleDrop };
}
