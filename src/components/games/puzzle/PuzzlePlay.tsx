import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { PIECE_MARGIN, PUZZLE_SIZE, isComplete, piecePath, type Piece, type PlaceResult, type PuzzleState } from '../../../lib/games/puzzle';
import type { PuzzleSceneId } from '../../../lib/games/puzzleScenes';
import { PlacedPiece, PuzzlePieceSvg } from './PuzzlePiece';
import { PuzzleScene } from './PuzzleScene';

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

export type PartnerHold = { pieceId: number; name: string; initial: string };

/**
 * Tablero + bandeja del puzzle, compartido por el modo solo y el de a dos.
 * Se puede arrastrar una pieza al tablero o tocarla y después tocar su lugar.
 */
export function PuzzlePlay({
  puzzle,
  scene,
  onPlace,
  onSelect,
  progressLabel,
  partnerHold = null,
  highlight = null,
  footer,
}: {
  puzzle: PuzzleState;
  scene: PuzzleSceneId;
  /** Intenta colocar la pieza; devuelve el resultado para dar la devolución. */
  onPlace: (pieceId: number, row: number, col: number) => PlaceResult;
  /** Se avisa qué pieza se tiene en la mano (para mostrársela a la otra persona). */
  onSelect?: (pieceId: number | null) => void;
  progressLabel: string;
  /** La pieza que tiene la otra persona en este momento. */
  partnerHold?: PartnerHold | null;
  /** Una pieza recién colocada por la otra persona, para resaltarla. */
  highlight?: number | null;
  footer?: ReactNode;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [guide, setGuide] = useState(true);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hint, setHint] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const hintTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  const complete = isComplete(puzzle);
  const total = puzzle.pieces.length;
  // Si la pieza elegida ya se colocó (por ejemplo, la otra persona), deja de estar elegida.
  const activeSelection = selected !== null && !puzzle.placed[selected] ? selected : null;

  function choose(pieceId: number | null) {
    setSelected(pieceId);
    onSelect?.(pieceId);
  }

  function showHint(text: string) {
    window.clearTimeout(hintTimer.current);
    setHint(text);
    hintTimer.current = window.setTimeout(() => setHint(''), HINT_MS);
  }

  function tryPlace(pieceId: number, row: number, col: number) {
    const result = onPlace(pieceId, row, col);
    if (result === 'placed') {
      choose(null);
      setHint('');
      const now = puzzle.placed.filter(Boolean).length + 1;
      setAnnouncement(now >= total ? 'Encajó la última pieza. Armaste el paisaje.' : `Encajó. ${now} de ${total}.`);
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
    if (moved && !drag.active) onSelect?.(drag.pieceId);
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
    choose(activeSelection === pieceId ? null : pieceId);
  }

  const dragged = drag?.active ? puzzle.pieces[drag.pieceId] : null;
  const highlighted = highlight !== null && puzzle.placed[highlight] ? puzzle.pieces[highlight] : null;

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-hidden="true">
          {progressLabel}
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
            {highlighted && !complete ? (
              <path
                data-testid="puzzle-highlight"
                d={piecePath(highlighted, puzzle.size)}
                fill="none"
                stroke="var(--presence)"
                strokeWidth="3"
                className="animate-soft-rise"
              />
            ) : null}
          </svg>

          {activeSelection !== null && !complete ? (
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
                  onClick={() => tryPlace(activeSelection, cell.row, cell.col)}
                  className="rounded-md outline-offset-[-2px] hover:bg-listening/15 disabled:pointer-events-none"
                />
              ))}
            </div>
          ) : null}
        </div>

        {complete ? null : (
          <div className="w-full sm:max-w-[16rem]">
            <p className="mb-2 min-h-5 text-center text-sm text-muted-foreground sm:text-left" aria-hidden="true">
              {hint || (activeSelection !== null ? 'Ahora tocá dónde va.' : 'Piezas sueltas')}
            </p>
            <ul aria-label="Piezas sueltas" className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {puzzle.tray.map((pieceId, index) => {
                const piece = puzzle.pieces[pieceId];
                const isDragging = drag?.active && drag.pieceId === pieceId;
                const partnerHas = partnerHold?.pieceId === pieceId;
                return (
                  <li key={pieceId} className="relative">
                    <button
                      type="button"
                      aria-pressed={activeSelection === pieceId}
                      aria-label={`Pieza ${index + 1}, ${pieceKind(piece, puzzle.size)}${partnerHas ? `. La está mirando ${partnerHold?.name}` : ''}`}
                      onPointerDown={(event) => onPointerDown(event, pieceId)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={() => setDrag(null)}
                      onClick={() => onPieceClick(pieceId)}
                      className={cn(
                        'block size-[4.5rem] touch-none rounded-xl p-0.5 transition-[box-shadow,opacity]',
                        activeSelection === pieceId ? 'bg-listening-soft ring-2 ring-listening' : 'hover:bg-muted',
                        partnerHas && activeSelection !== pieceId && 'bg-presence-soft ring-2 ring-presence/70',
                        isDragging && 'opacity-30',
                      )}
                    >
                      <PuzzlePieceSvg piece={piece} size={puzzle.size} scene={scene} className="h-full w-full" />
                    </button>
                    {partnerHas ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-presence text-[0.6rem] font-semibold text-presence-foreground shadow-soft"
                      >
                        {partnerHold?.initial}
                      </span>
                    ) : null}
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

      {footer}
    </div>
  );
}
