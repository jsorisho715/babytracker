import { useStore } from '../store/useStore';
import type { Player } from '../types';

export default function PlayerToggle() {
  const { activePlayer, setActivePlayer, scores } = useStore();

  const players: { player: Player; color: string; initial: string }[] = [
    { player: 'johnathan', color: 'sage', initial: 'J' },
    { player: 'jordyn', color: 'rose', initial: 'J' },
  ];

  return (
    <div className="flex items-center gap-1 bg-cream-200 rounded-2xl p-1">
      {players.map(({ player, initial }) => {
        const isActive = activePlayer === player;
        const score = scores[player];
        const isSage = player === 'johnathan';
        return (
          <button
            key={player}
            onClick={() => setActivePlayer(player)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 text-sm font-display font-700 ${
              isActive
                ? isSage
                  ? 'bg-sage-400 text-white shadow-soft'
                  : 'bg-rose-baby text-white shadow-soft'
                : 'text-warm-gray hover:bg-cream-100'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-800 ${
              isActive ? 'bg-white/25' : isSage ? 'bg-sage-100 text-sage-500' : 'bg-rose-light text-rose-medium'
            }`}>
              {initial}
            </span>
            <span className="hidden sm:inline">{score.displayName}</span>
            <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>{score.totalPoints}pts</span>
          </button>
        );
      })}
    </div>
  );
}
