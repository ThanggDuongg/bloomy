import { useLayoutEffect, useRef, useState } from 'react';

// Card width / height. Cards are taller than wide to fit the image + name.
const CARD_ASPECT = 3 / 4;
const GAP = 16;
const MIN_CARD_WIDTH = 150;
const MAX_CARD_WIDTH = 300;
const BOTTOM_MARGIN = 24;

interface Layout {
  columns: number;
  cardWidth: number;
}

/**
 * Picks a column count and card size for `count` cards. It tries to fit everything
 * within the viewport (below the board's top) so the whole board is visible without
 * scrolling, but never shrinks cards below MIN_CARD_WIDTH — when there are too many
 * cards it keeps them readable and lets the page scroll instead.
 */
export function useBoardLayout(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>({
    columns: Math.ceil(Math.sqrt(count)) || 1,
    cardWidth: MIN_CARD_WIDTH,
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const width = el.clientWidth;
      const height = window.innerHeight - el.getBoundingClientRect().top - BOTTOM_MARGIN;
      if (width === 0 || height <= 0) return;

      // Largest card size that would fit everything with no scrolling.
      let noScrollWidth = 0;
      for (let columns = 1; columns <= count; columns++) {
        const rows = Math.ceil(count / columns);
        const widthLimited = (width - GAP * (columns - 1)) / columns;
        const heightLimited = ((height - GAP * (rows - 1)) / rows) * CARD_ASPECT;
        noScrollWidth = Math.max(noScrollWidth, Math.min(widthLimited, heightLimited));
      }

      // Clamp to a comfortable range; if that no longer fits vertically, the page scrolls.
      const target = Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, noScrollWidth));
      const columns = Math.max(1, Math.min(count, Math.floor((width + GAP) / (target + GAP))));
      const cardWidth = Math.min(MAX_CARD_WIDTH, (width - GAP * (columns - 1)) / columns);

      setLayout({ columns, cardWidth });
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [count]);

  return { ref, ...layout };
}
