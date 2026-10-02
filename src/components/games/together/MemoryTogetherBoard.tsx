import { useEffect, useMemo, useState } from 'react';
import type { GameEvent, GameRoom } from '../../../api/gameRooms';
import { cn } from '../../../lib/cn';
import { personName } from '../../../lib/games/gameNames';
import { flip, hideMismatch, isComplete, isFaceUp, matchedPairs } from '../../../lib/games/memory';
import { MEMORY_SYMBOLS, MISMATCH_DELAY_MS } from '../../../lib/games/memorySymbols';
import { replayTogether, type Seat } from '../../../lib/games/memoryTogether';
import { Button, Card, PresenceGlyph } from '../../byourside/ui';

/**
 * Memoria de a dos: un tablero compartido, por turnos. El progreso es de
 * los dos ("3 de 6 parejas, juntos"): nadie lleva la cuenta de quién
 * encontró más.
 */
export function MemoryTogetherBoard({
  room,
  events,
  myId,
  send,
  onLeave,
}: {
  room: GameRoom;
  events: GameEvent[];
  myId: string;
  send: (type: string, payload: unknown) => Promise<void>;
  onLeave: () => void;
}) {
  const state = useMemo(() => replayTogether(room.seed, room.host.id, events), [room.seed, room.host.id, events]);
  const [settledSeq, setSettledSeq] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  // Dos cartas distintas quedan a la vista un momento y después se dan vuelta.
  useEffect(() => {
    if (state.mismatchSeq === null) return undefined;
    const seq = state.mismatchSeq;
    const timer = window.setTimeout(() => setSettledSeq(seq), MISMATCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state.mismatchSeq]);

  const game = state.mismatchSeq !== null && settledSeq === state.mismatchSeq ? hideMismatch(state.game) : state.game;
  const mySeat: Seat = room.host.id === myId ? 'host' : 'guest';
  const partner = mySeat === 'host' ? room.guest : room.host;
  const partnerName = personName(partner);
  const myTurn = state.turn === mySeat;
  const complete = isComplete(game);
  const total = game.cards.length / 2;
  const found = matchedPairs(game);

  async function play(type: string, payload: unknown) {
    setSending(true);
    setFailed(false);
    try {
      await send(type, payload);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  function onFlip(index: number) {
    if (!myTurn || sending || complete) return;
    if (flip(game, index).result === 'ignored') return;
    void play('FLIP', { index });
  }

  const turnText = complete
    ? `Encontraron todas las parejas juntos.`
    : myTurn
      ? 'Te toca: da vuelta dos cartas.'
      : `Le toca a ${partnerName}.`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm',
            myTurn && !complete ? 'bg-listening-soft text-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          <PresenceGlyph className="h-2.5 w-4" />
          {turnText}
        </p>
        <p className="text-sm text-muted-foreground" aria-hidden="true">
          {found} de {total} parejas, juntos
        </p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {turnText} {found} de {total} parejas.
      </p>

      {failed ? (
        <p role="alert" className="text-sm text-muted-foreground">
          No pudimos mandar la jugada. Probá de nuevo.
        </p>
      ) : null}

      <div className="mx-auto grid max-w-md grid-cols-4 gap-2.5 sm:gap-3" role="group" aria-label="Tablero compartido">
        {game.cards.map((card, index) => {
          const faceUp = isFaceUp(game, index);
          const meta = MEMORY_SYMBOLS[card.symbol];
          const Icon = meta.icon;
          return (
            <button
              key={`${state.round}-${card.id}`}
              type="button"
              onClick={() => onFlip(index)}
              aria-disabled={!myTurn || card.matched || undefined}
              aria-label={faceUp ? `Carta ${index + 1}: ${meta.label}${card.matched ? ', pareja encontrada' : ''}` : `Carta ${index + 1}, boca abajo`}
              className={cn(
                'flex aspect-square items-center justify-center rounded-2xl border shadow-soft transition-colors duration-300 motion-reduce:transition-none',
                !faceUp && (myTurn ? 'border-border bg-card hover:bg-muted' : 'border-border bg-card'),
                faceUp && !card.matched && 'border-foreground/15 bg-card',
                card.matched && (meta.tone === 'presence' ? 'border-transparent bg-presence-soft' : 'border-transparent bg-listening-soft'),
              )}
            >
              {faceUp ? (
                <Icon
                  aria-hidden="true"
                  className={cn('size-8 animate-gentle-pop sm:size-9', meta.tone === 'presence' ? 'text-presence-strong' : 'text-listening-strong')}
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
          <p className="font-serif text-xl">Encontraron todas las parejas</p>
          <p className="mt-1 text-sm text-muted-foreground">No se trataba de ganar: fue un rato compartido con {partnerName}.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" disabled={sending} onClick={() => void play('RESTART', { round: state.round + 1 })}>
              Otra ronda
            </Button>
            <Button type="button" variant="outline" onClick={onLeave}>
              Terminar por hoy
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
