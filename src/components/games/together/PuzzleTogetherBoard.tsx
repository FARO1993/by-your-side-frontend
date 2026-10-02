import { useMemo, useRef, useState } from 'react';
import type { GameEvent, GameRoom } from '../../../api/gameRooms';
import { personName } from '../../../lib/games/gameNames';
import type { Seat } from '../../../lib/games/memoryTogether';
import { isComplete, place, placedCount, type PieceCount, type PuzzleState } from '../../../lib/games/puzzle';
import { PUZZLE_SCENES, type PuzzleSceneId } from '../../../lib/games/puzzleScenes';
import { replayPuzzleTogether } from '../../../lib/games/puzzleTogether';
import { Button, Card } from '../../byourside/ui';
import { PuzzlePicker } from '../puzzle/PuzzlePicker';
import { PuzzlePlay } from '../puzzle/PuzzlePlay';

/**
 * Puzzle de a dos: los dos colocan piezas en el mismo tablero, a la vez y
 * sin turnos. Se ve qué pieza tiene en la mano la otra persona y la última
 * que encajó. Se puede armar en silencio: acompañar no siempre es hablar.
 */
export function PuzzleTogetherBoard({
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
  const state = useMemo(() => replayPuzzleTogether(room.seed, room.host.id, events), [room.seed, room.host.id, events]);
  const mySeat: Seat = room.host.id === myId ? 'host' : 'guest';
  const partnerSeat: Seat = mySeat === 'host' ? 'guest' : 'host';
  const partner = mySeat === 'host' ? room.guest : room.host;
  const partnerName = personName(partner);

  // Piezas que ya coloqué y todavía no volvieron confirmadas: se ven puestas igual.
  const [pending, setPending] = useState<{ round: number; pieceId: number }[]>([]);
  const [choosingRound, setChoosingRound] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [starting, setStarting] = useState(false);
  const lastHold = useRef<number | null>(null);

  const puzzle: PuzzleState | null = useMemo(() => {
    if (!state.puzzle) return null;
    return pending
      .filter((item) => item.round === state.round)
      .reduce((current, { pieceId }) => {
        const piece = current.pieces[pieceId];
        return piece ? place(current, pieceId, piece.row, piece.col).state : current;
      }, state.puzzle);
  }, [state.puzzle, state.round, pending]);

  async function start(scene: PuzzleSceneId, count: PieceCount) {
    setStarting(true);
    setFailed(false);
    try {
      await send('SETUP', { round: state.round + 1, scene, count });
      setChoosingRound(null);
    } catch {
      setFailed(true);
    } finally {
      setStarting(false);
    }
  }

  function onPlace(pieceId: number, row: number, col: number) {
    if (!puzzle) return 'ignored' as const;
    const { result } = place(puzzle, pieceId, row, col);
    if (result !== 'placed') return result;
    const round = state.round;
    lastHold.current = null;
    setPending((list) => [...list.filter((item) => item.round === round), { round, pieceId }]);
    setFailed(false);
    send('PLACE', { round, pieceId }).catch(() => {
      setPending((list) => list.filter((item) => !(item.round === round && item.pieceId === pieceId)));
      setFailed(true);
    });
    return result;
  }

  function onSelect(pieceId: number | null) {
    if (lastHold.current === pieceId) return;
    lastHold.current = pieceId;
    // Es solo para que la otra persona vea qué tenés en la mano: si falla, no pasa nada.
    send('HOLD', { round: state.round, pieceId }).catch(() => {});
  }

  if (!puzzle || !state.setup) {
    return (
      <Card className="space-y-4 p-5">
        <p className="font-serif text-xl">¿Qué arman?</p>
        <PuzzlePicker
          onStart={start}
          startLabel="Armar este"
          disabled={starting}
          note={`Lo puede elegir cualquiera de los dos: el primero que elige arma el puzzle para ambos.`}
        />
        {failed ? (
          <p role="alert" className="text-sm text-muted-foreground">
            No pudimos empezar. Probá de nuevo.
          </p>
        ) : null}
      </Card>
    );
  }

  const complete = isComplete(puzzle);
  const total = puzzle.pieces.length;
  const done = placedCount(puzzle);
  const partnerHeld = state.held[partnerSeat];
  const partnerPlaced = state.lastPlaced?.by === partnerSeat ? state.lastPlaced.pieceId : null;
  const sceneTitle = PUZZLE_SCENES.find((item) => item.id === state.setup?.scene)?.title ?? '';

  if (complete && choosingRound === state.round) {
    return (
      <Card className="space-y-4 p-5">
        <p className="font-serif text-xl">Otro puzzle</p>
        <PuzzlePicker
          onStart={start}
          initialScene={state.setup.scene}
          initialCount={state.setup.count}
          startLabel="Armar este"
          disabled={starting}
        />
        <Button type="button" variant="ghost" onClick={() => setChoosingRound(null)}>
          Volver
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{sceneTitle}. Pueden poner piezas los dos a la vez.</p>
      <p role="status" aria-live="polite" className="sr-only">
        {partnerPlaced !== null ? `${partnerName} encajó una pieza. ${done} de ${total}, juntos.` : ''}
      </p>
      {failed ? (
        <p role="alert" className="text-sm text-muted-foreground">
          No pudimos mandar la jugada. Probá de nuevo.
        </p>
      ) : null}
      <PuzzlePlay
        key={state.round}
        puzzle={puzzle}
        scene={state.setup.scene}
        onPlace={onPlace}
        onSelect={onSelect}
        progressLabel={`${done} de ${total} piezas, juntos`}
        partnerHold={
          partnerHeld !== null ? { pieceId: partnerHeld, name: partnerName, initial: partnerName.charAt(0).toUpperCase() } : null
        }
        highlight={partnerPlaced}
        footer={
          complete ? (
            <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
              <p className="font-serif text-xl">Armaron el paisaje juntos</p>
              <p className="mt-1 text-sm text-muted-foreground">Pieza por pieza, con {partnerName}. A veces alcanza con estar.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="listening" onClick={() => setChoosingRound(state.round)}>
                  Otro puzzle
                </Button>
                <Button type="button" variant="outline" onClick={onLeave}>
                  Terminar por hoy
                </Button>
              </div>
            </Card>
          ) : null
        }
      />
    </div>
  );
}
