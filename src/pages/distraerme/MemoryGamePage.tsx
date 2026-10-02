import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud,
  Feather,
  Flower2,
  Leaf,
  Moon,
  Mountain,
  Sprout,
  Star,
  Sun,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { Button, Card, PresenceGlyph } from '../../components/byourside/ui';
import { cn } from '../../lib/cn';
import {
  createGame,
  flip,
  hideMismatch,
  isComplete,
  isFaceUp,
  matchedPairs,
  type MemoryState,
} from '../../lib/games/memory';

const SYMBOLS: Record<string, { label: string; icon: LucideIcon; tone: 'presence' | 'listening' }> = {
  luna: { label: 'Luna', icon: Moon, tone: 'listening' },
  sol: { label: 'Sol', icon: Sun, tone: 'presence' },
  hoja: { label: 'Hoja', icon: Leaf, tone: 'listening' },
  nube: { label: 'Nube', icon: Cloud, tone: 'listening' },
  olas: { label: 'Olas', icon: Waves, tone: 'listening' },
  estrella: { label: 'Estrella', icon: Star, tone: 'presence' },
  flor: { label: 'Flor', icon: Flower2, tone: 'presence' },
  pluma: { label: 'Pluma', icon: Feather, tone: 'presence' },
  montana: { label: 'Montaña', icon: Mountain, tone: 'listening' },
  brote: { label: 'Brote', icon: Sprout, tone: 'presence' },
};

/** Orden de símbolos con el que se arma el mazo (exportado para tests deterministas). */
export const MEMORY_SYMBOL_KEYS = Object.keys(SYMBOLS);

const SIZES = [
  { pairs: 6, label: '6 parejas' },
  { pairs: 8, label: '8 parejas' },
] as const;

/** Tiempo que quedan a la vista dos cartas que no son pareja. */
export const MISMATCH_DELAY_MS = 1000;

export default function MemoryGamePage() {
  const navigate = useNavigate();
  const [pairs, setPairs] = useState<number>(6);
  const [game, setGame] = useState<MemoryState>(() => createGame(MEMORY_SYMBOL_KEYS, 6));
  const [announcement, setAnnouncement] = useState('');
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  function restart(nextPairs = pairs) {
    window.clearTimeout(hideTimer.current);
    setPairs(nextPairs);
    setGame(createGame(MEMORY_SYMBOL_KEYS, nextPairs));
    setAnnouncement('Nueva partida.');
  }

  function handleFlip(index: number) {
    const { state, result } = flip(game, index);
    if (result === 'ignored') return;
    setGame(state);
    const label = SYMBOLS[state.cards[index].symbol].label;
    if (result === 'flipped') setAnnouncement(label);
    if (result === 'match') {
      const found = matchedPairs(state);
      setAnnouncement(
        isComplete(state)
          ? `Pareja: ${label}. Encontraste todas las parejas.`
          : `Pareja: ${label}. ${found} de ${state.cards.length / 2}.`,
      );
    }
    if (result === 'mismatch') {
      const first = SYMBOLS[state.cards[state.flipped[0]].symbol].label;
      setAnnouncement(`${label}. No eran pareja: ${first} y ${label}.`);
      hideTimer.current = window.setTimeout(() => setGame((current) => hideMismatch(current)), MISMATCH_DELAY_MS);
    }
  }

  const total = game.cards.length / 2;
  const found = matchedPairs(game);
  const complete = isComplete(game);

  return (
    <GameShell
      title="Memoria"
      subtitle="Sin reloj y sin apuro. Da vuelta dos cartas y buscá las parejas."
      actions={
        <Button type="button" size="sm" variant="outline" onClick={() => restart()}>
          Empezar de nuevo
        </Button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-hidden="true">
          {found} de {total} parejas
        </p>
        <div role="group" aria-label="Cantidad de cartas" className="flex gap-1 rounded-full bg-muted p-1">
          {SIZES.map((size) => (
            <button
              key={size.pairs}
              type="button"
              aria-pressed={pairs === size.pairs}
              onClick={() => restart(size.pairs)}
              className={cn(
                'min-h-9 rounded-full px-3 text-sm transition-colors',
                pairs === size.pairs ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground',
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div
        className={cn('mx-auto grid max-w-md grid-cols-4 gap-2.5 sm:gap-3')}
        role="group"
        aria-label={`Tablero de ${total} parejas`}
      >
        {game.cards.map((card, index) => {
          const faceUp = isFaceUp(game, index);
          const meta = SYMBOLS[card.symbol];
          const Icon = meta.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(index)}
              aria-label={faceUp ? `Carta ${index + 1}: ${meta.label}${card.matched ? ', pareja encontrada' : ''}` : `Carta ${index + 1}, boca abajo`}
              aria-disabled={card.matched || undefined}
              className={cn(
                'flex aspect-square items-center justify-center rounded-2xl border shadow-soft transition-colors duration-300 motion-reduce:transition-none',
                !faceUp && 'border-border bg-card hover:bg-muted',
                faceUp && !card.matched && 'border-foreground/15 bg-card',
                card.matched && (meta.tone === 'presence' ? 'border-transparent bg-presence-soft' : 'border-transparent bg-listening-soft'),
              )}
            >
              {faceUp ? (
                <Icon
                  aria-hidden="true"
                  className={cn(
                    'size-8 animate-gentle-pop sm:size-9',
                    meta.tone === 'presence' ? 'text-presence-strong' : 'text-listening-strong',
                  )}
                />
              ) : (
                <PresenceGlyph className="h-3.5 w-6 text-muted-foreground/50" />
              )}
            </button>
          );
        })}
      </div>

      {complete ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Encontraste todas las parejas</p>
          <p className="mt-1 text-sm text-muted-foreground">No se trataba de ganar: fue un rato para vos.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={() => restart()}>
              Otra vez
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/distraerme?jugar=solo')}>
              Elegir otro juego
            </Button>
          </div>
        </Card>
      ) : null}
    </GameShell>
  );
}
