import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shuffle } from '../../lib/shuffle';

interface UseSortOptions {
  onMatch?: () => void;
  onMismatch?: () => void;
}

/**
 * Generic drag-into-basket sorting: given item ids and a function that decides which
 * basket each item belongs to, tracks which items have been correctly placed and the
 * matched/total count per basket. `basketOf` is game-mode-specific (by category, by
 * habitat, by dominant color...) — this hook doesn't care which.
 */
export function useSort(
  itemIds: string[],
  basketOf: (id: string) => string,
  options: UseSortOptions = {},
) {
  const items = useMemo(() => shuffle(itemIds), [itemIds]);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const baskets = useMemo(() => [...new Set(itemIds.map(basketOf))], [itemIds, basketOf]);

  const totalPerBasket = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of itemIds) {
      const key = basketOf(id);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [itemIds, basketOf]);

  // Which item ids landed in each basket — lets the UI actually show the settled
  // items inside their basket (like a drawer), not just a count.
  const matchedIdsPerBasket = useMemo(() => {
    const ids: Record<string, string[]> = {};
    for (const id of matched) {
      const key = basketOf(id);
      (ids[key] ??= []).push(id);
    }
    return ids;
  }, [matched, basketOf]);

  const matchedPerBasket = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [key, ids] of Object.entries(matchedIdsPerBasket)) {
      counts[key] = ids.length;
    }
    return counts;
  }, [matchedIdsPerBasket]);

  const handleDrop = useCallback(
    (itemId: string, targetBasket: string | null) => {
      if (targetBasket === null) return;
      if (basketOf(itemId) === targetBasket) {
        setMatched((m) => new Set(m).add(itemId));
        optionsRef.current.onMatch?.();
      } else {
        optionsRef.current.onMismatch?.();
      }
    },
    [basketOf],
  );

  const isComplete = matched.size === itemIds.length && itemIds.length > 0;

  return {
    items,
    baskets,
    totalPerBasket,
    matchedPerBasket,
    matchedIdsPerBasket,
    matched,
    isComplete,
    handleDrop,
  };
}
