import { AnimatedBackground } from '../components/AnimatedBackground';
import { LanguageToggle } from '../components/LanguageToggle';
import { games } from '../games/registry';

interface HomeScreenProps {
  onSelectGame: (gameId: string) => void;
}

export function HomeScreen({ onSelectGame }: HomeScreenProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <AnimatedBackground />
      <h1 className="text-6xl font-extrabold text-earth drop-shadow">Bloomy</h1>
      <LanguageToggle />

      <section className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-earth drop-shadow">Chọn trò chơi</h2>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => onSelectGame(game.id)}
              className="flex w-40 flex-col items-center gap-3 rounded-3xl bg-white/80 p-6 shadow-lg transition-transform active:scale-95"
            >
              <span className="text-6xl">{game.emoji}</span>
              <span className="text-xl font-extrabold text-earth">{game.name}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
