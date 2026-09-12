import { useState } from 'react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { DifficultySelector } from '../components/DifficultySelector';
import { categoryList } from '../data';
import { availableSortModes } from '../games/sort/modes';
import type { GameMeta } from '../games/registry';

interface SetupScreenProps {
  game: GameMeta;
  onStart: (categoryIds: string[], count: number, modeId?: string, presetId?: string) => void;
  onBack: () => void;
}

export function SetupScreen({ game, onStart, onBack }: SetupScreenProps) {
  const allowed = game.allowedCategories;
  const availableCategories = allowed ? categoryList.filter((c) => allowed.includes(c.id)) : categoryList;

  const [selected, setSelected] = useState<string[]>([availableCategories[0].id]);
  const [count, setCount] = useState(game.defaultCount);
  const [presetId, setPresetId] = useState<string | null>(game.presets?.[0]?.id ?? null);

  const modes = game.sortModes;
  const validModes = modes ? availableSortModes(selected) : [];
  // Remembers the user's last explicit mode click. If the category selection later
  // makes that choice invalid (e.g. deselecting "Động vật" while "Nơi sống" was
  // picked), `modeId` below falls back to the first still-valid mode — computed
  // directly during render, no effect/setState round-trip needed.
  const [modePreference, setModePreference] = useState<string | null>(
    modes ? (validModes[0]?.id ?? null) : null,
  );
  const modeId = modes
    ? (validModes.find((m) => m.id === modePreference)?.id ?? (validModes[0]?.id ?? null))
    : null;

  const toggle = (id: string) => {
    if (game.singleCategory) {
      setSelected([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canStart =
    (game.noCategories || selected.length > 0) &&
    (!modes || modeId !== null) &&
    (!game.presets || presetId !== null);

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

      {!game.noCategories && (
        <section className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-earth drop-shadow">Chủ đề</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {availableCategories.map((category) => {
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
      )}

      {modes && (
        <section className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-earth drop-shadow">Chế độ</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {validModes.map((mode) => {
              const on = modeId === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setModePreference(mode.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold text-earth shadow transition-transform active:scale-95 ${
                    on ? 'bg-peach ring-2 ring-flower' : 'bg-white/80'
                  }`}
                >
                  <span className="text-2xl">{mode.emoji}</span>
                  {mode.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {game.presets ? (
        <section className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-bold text-earth drop-shadow">Độ khó</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {game.presets.map((preset) => {
              const on = presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPresetId(preset.id)}
                  aria-pressed={on}
                  className={`rounded-2xl px-5 py-3 text-lg font-bold text-earth shadow transition-transform active:scale-95 ${
                    on ? 'bg-peach ring-2 ring-flower' : 'bg-white/80'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <DifficultySelector
          value={count}
          onChange={setCount}
          min={game.minCount}
          max={game.maxCount}
          unitLabel={game.unitLabel}
        />
      )}

      <button
        type="button"
        onClick={() => onStart(selected, count, modeId ?? undefined, presetId ?? undefined)}
        disabled={!canStart}
        className="rounded-full bg-flower px-10 py-4 text-2xl font-extrabold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Chơi
      </button>
    </main>
  );
}
