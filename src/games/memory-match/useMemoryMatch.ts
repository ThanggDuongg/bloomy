import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { buildDeck, type Card } from './deck';

interface MemoryMatchOptions {
  onMatch?: () => void;
  onMismatch?: () => void;
}

export function useMemoryMatch(itemIds: string[], options: MemoryMatchOptions = {}) {
  const cards = useMemo<Card[]>(() => buildDeck(itemIds), [itemIds]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());

  // Keep the latest callbacks without forcing `flip` to change identity.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const flip = useCallback(
    (key: string) => {
      const card = cards.find((c) => c.key === key);
      if (!card) return;
      if (matched.has(card.itemId) || revealed.has(key)) return;
      if (revealed.size >= 2) return; // wait for the current pair to resolve

      const nextRevealed = new Set(revealed).add(key);
      setRevealed(nextRevealed);

      if (nextRevealed.size === 2) {
        const [k1, k2] = [...nextRevealed];
        const c1 = cards.find((c) => c.key === k1)!;
        const c2 = cards.find((c) => c.key === k2)!;
        if (c1.itemId === c2.itemId) {
          setMatched((m) => new Set(m).add(c1.itemId));
          setRevealed(new Set());
          optionsRef.current.onMatch?.();
        } else {
          optionsRef.current.onMismatch?.();
          setTimeout(() => setRevealed(new Set()), 1000);
        }
      }
    },
    [cards, matched, revealed],
  );

  const isComplete = matched.size === itemIds.length && itemIds.length > 0;

  return { cards, revealed, matched, isComplete, flip };
}
