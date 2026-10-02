import type { GameEvent } from '../../api/gameRooms';
import { PIECE_COUNTS, createPuzzle, isComplete, place, type PieceCount, type PuzzleState } from './puzzle';
import { PUZZLE_SCENES, type PuzzleSceneId } from './puzzleScenes';
import { seededRandom } from './seededRandom';
import type { Seat } from './memoryTogether';

/**
 * Puzzle de a dos: un mismo tablero, los dos colocan piezas a la vez, sin
 * turnos. No hay "quién puso más": el progreso es de los dos.
 *
 * Igual que Memoria, el estado sale de reproducir las jugadas en orden (seq):
 * - SETUP { round, scene, count }: arma el puzzle de la ronda siguiente.
 *   Si las dos personas eligen a la vez, vale el primero (seq menor).
 * - PLACE { round, pieceId }: encajó una pieza (ya validada en el cliente).
 * - HOLD { round, pieceId | null }: qué pieza tiene en la mano cada persona,
 *   para que la otra lo vea. Es solo compañía visual: no bloquea nada.
 */
export type PuzzleSetup = { scene: PuzzleSceneId; count: PieceCount };

export type PuzzleTogetherState = {
  round: number;
  setup: PuzzleSetup | null;
  puzzle: PuzzleState | null;
  held: Record<Seat, number | null>;
  /** Última pieza colocada y por quién (para resaltarla). */
  lastPlaced: { pieceId: number; by: Seat } | null;
  seq: number;
};

export function initialPuzzleTogether(): PuzzleTogetherState {
  return { round: 0, setup: null, puzzle: null, held: { host: null, guest: null }, lastPlaced: null, seq: 0 };
}

export function puzzleForRound(seed: number, round: number, count: PieceCount): PuzzleState {
  return createPuzzle(count, seededRandom(seed + round * 7919));
}

type Payload = { round?: unknown; scene?: unknown; count?: unknown; pieceId?: unknown };

function isScene(value: unknown): value is PuzzleSceneId {
  return PUZZLE_SCENES.some((scene) => scene.id === value);
}

function isCount(value: unknown): value is PieceCount {
  return PIECE_COUNTS.includes(value as PieceCount);
}

export function applyPuzzleTogether(
  state: PuzzleTogetherState,
  event: GameEvent,
  seed: number,
  hostId: string,
): PuzzleTogetherState {
  if (event.seq <= state.seq) return state;
  const actor: Seat = event.actorId === hostId ? 'host' : 'guest';
  const payload = (event.payload ?? {}) as Payload;
  const next: PuzzleTogetherState = { ...state, seq: event.seq };

  if (event.type === 'SETUP') {
    const round = Number(payload.round);
    if (round !== state.round + 1 || !isScene(payload.scene) || !isCount(payload.count)) return next;
    // Mientras un puzzle está a medio armar no se cambia por otro.
    if (state.puzzle && !isComplete(state.puzzle)) return next;
    return {
      round,
      setup: { scene: payload.scene, count: payload.count },
      puzzle: puzzleForRound(seed, round, payload.count),
      held: { host: null, guest: null },
      lastPlaced: null,
      seq: event.seq,
    };
  }

  if (!state.puzzle || Number(payload.round) !== state.round) return next;

  if (event.type === 'PLACE') {
    const pieceId = Number(payload.pieceId);
    const piece = state.puzzle.pieces[pieceId];
    if (!Number.isInteger(pieceId) || !piece) return next;
    const { state: puzzle, result } = place(state.puzzle, pieceId, piece.row, piece.col);
    if (result !== 'placed') return next;
    const held = { ...state.held };
    (Object.keys(held) as Seat[]).forEach((seat) => {
      if (held[seat] === pieceId) held[seat] = null;
    });
    return { ...next, puzzle, held, lastPlaced: { pieceId, by: actor } };
  }

  if (event.type === 'HOLD') {
    const raw = payload.pieceId;
    if (raw === null) return { ...next, held: { ...state.held, [actor]: null } };
    const pieceId = Number(raw);
    if (!Number.isInteger(pieceId) || !state.puzzle.pieces[pieceId] || state.puzzle.placed[pieceId]) return next;
    return { ...next, held: { ...state.held, [actor]: pieceId } };
  }

  return next;
}

export function replayPuzzleTogether(seed: number, hostId: string, events: GameEvent[]): PuzzleTogetherState {
  return [...events]
    .sort((a, b) => a.seq - b.seq)
    .reduce((state, event) => applyPuzzleTogether(state, event, seed, hostId), initialPuzzleTogether());
}
