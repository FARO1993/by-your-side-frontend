import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shuffle } from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { PlacedPiece, PuzzlePieceSvg } from '../../components/games/puzzle/PuzzlePiece';
import { PuzzleScene } from '../../components/games/puzzle/PuzzleScene';
import { Button, Card } from '../../components/byourside/ui';
import { cn } from '../../lib/cn';
import {
  PIECE_COUNTS,
  PIECE_MARGIN,
  PUZZLE_SIZE,
  createPuzzle,
  isComplete,
  place,
  placedCount,
  type Piece,
  type PieceCount,
  type PuzzleState,
} from '../../lib/games/puzzle';
import { PUZZLE_SCENES, type PuzzleSceneId } from '../../lib/games/puzzleScenes';

/** Distancia (px) a partir de la cual tocar una pieza pasa a ser arrastrarla. */
const DRAG_THRESHOLD = 6;
const HINT_MS = 1800;

type Drag = {
  pieceId: number;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  /** Tamaño (px) de la pieza arrastrada: el mismo que tendrá en el tablero. */
  piecePx: number;
};

function pieceKind(piece: Piece, size: number): string {
  const edges = [piece.row === 0, piece.row === size - 1, piece.col === 0, piece.col === size - 1].filter(Boolean).length;
  if (edges >= 2) return 'esquina';
  if (edges === 1) return 'borde';
  return 'del centro';
}

export default function PuzzleGamePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'choosing' | 'playing'>('choosing');
  const [scene, setScene] = useState<PuzzleSceneId>('lago');
  const [count, setCount] = useState<PieceCount>(9);
  const [puzzle, setPuzzle] = useState<PuzzleState>(() => createPuzzle(9));
  const [selected, setSelected] = useState<number | null>(null);
  const [guide, setGuide] = useState(true);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hint, setHint] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const hintTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  const total = puzzle.pieces.length;
  const done = placedCount(puzzle);
  const complete = phase === 'playing' && isComplete(puzzle);
  const sceneTitle = PUZZLE_SCENES.find((item) => item.id === scene)?.title ?? '';

  function start() {
    setPuzzle(createPuzzle(count));
    setSelected(null);
    setHint('');
    setAnnouncement(`Puzzle de ${count} piezas: ${sceneTitle}.`);
    setPhase('playing');
  }

  function showHint(text: string) {
    window.clearTimeout(hintTimer.current);
    setHint(text);
    hintTimer.current = window.setTimeout(() => setHint(''), HINT_MS);
  }

  function tryPlace(pieceId: number, row: number, col: number) {
    const { state, result } = place(puzzle, pieceId, row, col);
    if (result === 'placed') {
      setPuzzle(state);
      setSelected(null);
      setHint('');
      const now = placedCount(state);
      setAnnouncement(isComplete(state) ? 'Encajó la última pieza. Armaste el paisaje.' : `Encajó. ${now} de ${total}.`);
    } else if (result === 'wrong') {
      showHint('Esa va en otro lugar. Probá de nuevo cuando quieras.');
      setAnnouncement('Esa pieza va en otro lugar.');
    }
  }

  function cellAt(clientX: number, clientY: number): { row: number; col: number } | null {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * puzzle.size);
    const row = Math.floor(((clientY - rect.top) / rect.height) * puzzle.size);
    if (row < 0 || col < 0 || row >= puzzle.size || col >= puzzle.size) return null;
    return { row, col };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>, pieceId: number) {
    if (event.button !== 0) return;
    draggedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const boardWidth = boardRef.current?.getBoundingClientRect().width ?? 0;
    setDrag({
      pieceId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      active: false,
      piecePx: (boardWidth / puzzle.size) * (1 + PIECE_MARGIN * 2),
    });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > DRAG_THRESHOLD;
    setDrag({ ...drag, x: event.clientX, y: event.clientY, active: drag.active || moved });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.active) {
      draggedRef.current = true;
      const cell = cellAt(event.clientX, event.clientY);
      if (cell) tryPlace(drag.pieceId, cell.row, cell.col);
    }
    setDrag(null);
  }

  function onPieceClick(pieceId: number) {
    // Después de arrastrar llega igual un click: no tiene que seleccionar.
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setSelected((current) => (current === pieceId ? null : pieceId));
  }

  const dragged = drag?.active ? puzzle.pieces[drag.pieceId] : null;

  if (phase === 'choosing') {
    return (
      <GameShell title="Puzzle" subtitle="Pieza por pieza, sin reloj. Si una no va, vuelve a la bandeja y listo.">
        <section aria-labelledby="puzzle-image" className="space-y-3">
          <h2 id="puzzle-image" className="font-serif text-lg">
            Elegí una imagen
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {PUZZLE_SCENES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={scene === item.id}
                onClick={() => setScene(item.id)}
                className={cn(
                  'overflow-hidden rounded-2xl bg-card text-left shadow-soft transition-shadow',
                  scene === item.id ? 'ring-2 ring-listening' : 'hover:shadow-lift',
                )}
              >
                <svg viewBox={`0 0 ${PUZZLE_SIZE} ${PUZZLE_SIZE}`} className="block aspect-square w-full" aria-hidden="true">
                  <PuzzleScene id={item.id} />
                </svg>
                <span className="block px-2 py-2 text-xs font-medium text-foreground sm:text-sm">{item.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="puzzle-count" className="space-y-3">
          <h2 id="puzzle-count" className="font-serif text-lg">
            ¿Cuántas piezas?
          </h2>
          <div role="group" aria-labelledby="puzzle-count" className="inline-flex gap-1 rounded-full bg-muted p-1">
            {PIECE_COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={count === option}
                onClick={() => setCount(option)}
                className={cn(
                  'min-h-10 rounded-full px-4 text-sm transition-colors',
                  count === option ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground',
                )}
              >
                {option} piezas
              </button>
            ))}
          </div>
        </section>

        <Button type="button" variant="listening" onClick={start}>
          Empezar
        </Button>
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Puzzle"
      subtitle={`${sceneTitle}. Arrastrá cada pieza a su lugar, o tocala y después tocá dónde va.`}
      actions={
        <Button type="button" size="sm" variant="outline" onClick={() => setPhase('choosing')}>
          <Shuffle className="size-4" aria-hidden="true" />
          Cambiar puzzle
        </Button>
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <p className="sr-only">
        Juego visual. Elegí una pieza de la bandeja y después el lugar del tablero donde va. Las piezas de esquina y de
        borde están indicadas.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-hidden="true">
          {done} de {total} piezas
        </p>
        <button
          type="button"
          aria-pressed={guide}
          onClick={() => setGuide((value) => !value)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-sm text-muted-foreground"
        >
          {guide ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
          Guía
        </button>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-center">
        <div ref={boardRef} className="relative aspect-square w-full max-w-[20rem] shrink-0" data-testid="puzzle-board">
          <svg
            viewBox={`0 0 ${PUZZLE_SIZE} ${PUZZLE_SIZE}`}
            className="block h-full w-full overflow-hidden rounded-2xl bg-muted shadow-soft"
            aria-hidden="true"
          >
            {guide ? (
              <g opacity="0.18">
                <PuzzleScene id={scene} />
              </g>
            ) : null}
            {puzzle.pieces
              .filter((piece) => puzzle.placed[piece.id])
              .map((piece) => (
                <PlacedPiece key={piece.id} piece={piece} size={puzzle.size} scene={scene} outline={!complete} />
              ))}
          </svg>

          {selected !== null && !complete ? (
            <div
              role="group"
              aria-label="Lugares del tablero"
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
            >
              {puzzle.pieces.map((cell) => (
                <button
                  key={cell.id}
                  type="button"
                  disabled={puzzle.placed[cell.id]}
                  aria-label={`Fila ${cell.row + 1}, columna ${cell.col + 1}`}
                  onClick={() => tryPlace(selected, cell.row, cell.col)}
                  className="rounded-md outline-offset-[-2px] hover:bg-listening/15 disabled:pointer-events-none"
                />
              ))}
            </div>
          ) : null}
        </div>

        {complete ? null : (
          <div className="w-full sm:max-w-[16rem]">
            <p className="mb-2 min-h-5 text-center text-sm text-muted-foreground sm:text-left" aria-hidden="true">
              {hint || (selected !== null ? 'Ahora tocá dónde va.' : 'Piezas sueltas')}
            </p>
            <ul aria-label="Piezas sueltas" className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {puzzle.tray.map((pieceId, index) => {
                const piece = puzzle.pieces[pieceId];
                const isDragging = drag?.active && drag.pieceId === pieceId;
                return (
                  <li key={pieceId}>
                    <button
                      type="button"
                      aria-pressed={selected === pieceId}
                      aria-label={`Pieza ${index + 1}, ${pieceKind(piece, puzzle.size)}`}
                      onPointerDown={(event) => onPointerDown(event, pieceId)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={() => setDrag(null)}
                      onClick={() => onPieceClick(pieceId)}
                      className={cn(
                        'block size-[4.5rem] touch-none rounded-xl p-0.5 transition-[box-shadow,opacity]',
                        selected === pieceId ? 'bg-listening-soft ring-2 ring-listening' : 'hover:bg-muted',
                        isDragging && 'opacity-30',
                      )}
                    >
                      <PuzzlePieceSvg piece={piece} size={puzzle.size} scene={scene} className="h-full w-full" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {dragged && drag && drag.piecePx > 0 ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 drop-shadow-lg"
          style={{
            width: drag.piecePx,
            height: drag.piecePx,
            left: drag.x - drag.piecePx / 2,
            top: drag.y - drag.piecePx / 2,
          }}
        >
          <PuzzlePieceSvg piece={dragged} size={puzzle.size} scene={scene} className="h-full w-full" />
        </div>
      ) : null}

      {complete ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Armaste el paisaje</p>
          <p className="mt-1 text-sm text-muted-foreground">Pieza por pieza, sin reloj. Fue un rato para vos.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={() => setPhase('choosing')}>
              Otro puzzle
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
