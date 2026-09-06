import { useState } from 'react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { DifficultySelector } from '../components/DifficultySelector';
import { categoryList } from '../data';
import type { GameMeta } from '../games/registry';

interface SetupScreenProps {
  game: GameMeta;
  onStart: (categoryIds: string[], pairs: number) => void;
  onBack: () => void;
}

export function SetupScreen({ game, onStart, onBack }: SetupScreenProps) {
  const [selected, setSelected] = useState<string[]>(['fruit']);
  const [pairs, setPairs] = useState(game.defaultPairs);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <AnimatedBackground />
      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-4 rounded-xl bg-white/80 px-4 py-2 font-bold text-earth shadow"
      >
        ← Trang chủ
      </button>

      <h1 className="text-4xl font-extrabold text-earth drop-shadow">
        {game.emoji} {game.name}
      </h1>

      <section className="flex flex-col items-center gap-3">
        <h2 className="text-xl font-bold text-earth drop-shadow">Chủ đề</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categoryList.map((category) => {
            const on = selected.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggle(category.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold text-earth shadow transition-transform active:scale-95 ${
                  on ? 'bg-peach ring-2 ring-flower' : 'bg-white/80'
                }`}
              >
                <span className="text-2xl">{category.emoji}</span>
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      <DifficultySelector value={pairs} onChange={setPairs} min={game.minPairs} max={game.maxPairs} />

      <button
        type="button"
        onClick={() => onStart(selected, pairs)}
        disabled={selected.length === 0}
        className="rounded-full bg-flower px-10 py-4 text-2xl font-extrabold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Chơi
      </button>
    </main>
  );
}
