import type { GameEvent } from '../../api/gameRooms';
import { createGame, flip, hideMismatch, isComplete, isWaiting, type MemoryState } from './memory';
import { MEMORY_SYMBOL_KEYS } from './memorySymbols';
import { seededRandom } from './seededRandom';

/**
 * Memoria de a dos: un solo tablero, por turnos. Se buscan las parejas
 * JUNTOS: no hay puntaje por persona ni quién encontró más.
 *
 * El estado se obtiene reproduciendo las jugadas en orden (seq), así que las
 * dos personas llegan siempre al mismo tablero. Jugadas que no corresponden
 * (no es tu turno, carta ya dada vuelta) se ignoran igual en ambos lados.
 *
 * Jugadas: FLIP { index } y RESTART { round }.
 */
export const TOGETHER_PAIRS = 6;

export type Seat = 'host' | 'guest';

export type MemoryTogetherState = {
  round: number;
  game: MemoryState;
  turn: Seat;
  /** seq de la última jugada aplicada. */
  seq: number;
  /** seq de la jugada que dejó dos cartas distintas boca arriba (para esconderlas después). */
  mismatchSeq: number | null;
};

function deck(seed: number, round: number): MemoryState {
  return createGame(MEMORY_SYMBOL_KEYS, TOGETHER_PAIRS, seededRandom(seed + round * 7919));
}

export function initialTogether(seed: number): MemoryTogetherState {
  return { round: 0, game: deck(seed, 0), turn: 'host', seq: 0, mismatchSeq: null };
}

export function other(seat: Seat): Seat {
  return seat === 'host' ? 'guest' : 'host';
}

export type FlipPayload = { index: number };
export type RestartPayload = { round: number };

export function applyTogether(
  state: MemoryTogetherState,
  event: GameEvent,
  seed: number,
  hostId: string,
): MemoryTogetherState {
  if (event.seq <= state.seq) return state;
  const actor: Seat = event.actorId === hostId ? 'host' : 'guest';
  const next = { ...state, seq: event.seq };

  if (event.type === 'RESTART') {
    const round = Number((event.payload as RestartPayload | null)?.round);
    // Solo vale pedir la ronda siguiente a la actual (dos pedidos a la vez = una sola ronda nueva).
    if (round !== state.round + 1) return next;
    return { round, game: deck(seed, round), turn: 'host', seq: event.seq, mismatchSeq: null };
  }

  if (event.type === 'FLIP') {
    if (actor !== state.turn || isComplete(state.game)) return next;
    const index = Number((event.payload as FlipPayload | null)?.index);
    if (!Number.isInteger(index)) return next;

    // Si quedaron dos cartas distintas boca arriba, se esconden antes de seguir.
    const base = isWaiting(state.game) ? hideMismatch(state.game) : state.game;
    const { state: game, result } = flip(base, index);
    if (result === 'ignored') return { ...next, game: base };

    const attemptDone = result === 'match' || result === 'mismatch';
    return {
      ...next,
      game,
      // Al terminar cada intento (dos cartas) el turno pasa a la otra persona.
      turn: attemptDone ? other(state.turn) : state.turn,
      mismatchSeq: result === 'mismatch' ? event.seq : null,
    };
  }

  return next;
}

export function replayTogether(seed: number, hostId: string, events: GameEvent[]): MemoryTogetherState {
  return [...events].sort((a, b) => a.seq - b.seq).reduce((state, event) => applyTogether(state, event, seed, hostId), initialTogether(seed));
}
