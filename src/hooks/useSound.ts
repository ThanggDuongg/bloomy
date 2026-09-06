import { useCallback, useMemo } from 'react';

function play(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {
    // ignore audio failures (e.g. autoplay policy)
  }
}

export function useSound() {
  const playClick = useCallback(() => play('/sounds/click.mp3'), []);
  const playSuccess = useCallback(() => play('/sounds/success.mp3'), []);
  const playError = useCallback(() => play('/sounds/error.mp3'), []);
  return useMemo(
    () => ({ playClick, playSuccess, playError }),
    [playClick, playSuccess, playError],
  );
}
