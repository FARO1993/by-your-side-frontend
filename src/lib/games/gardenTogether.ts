import type { GameEvent } from '../../api/gameRooms';
import { SPECIES, createGarden, growIfFull, plantSeed, water, type GardenEvent, type GardenState, type Species } from './garden';

/**
 * Jardín compartido: el mismo jardín para dos personas, que sigue creciendo
 * de una partida a la otra. El estado sale de reproducir, en orden, la
 * historia (partidas anteriores) y después las jugadas de la partida actual.
 *
 * Jugadas: PLANT { index, species } y WATER { index }. Igual que el jardín
 * propio, nada se marchita y no hay turnos.
 */
export type GardenAction = {
  actorId: string;
  index: number;
  event: GardenEvent;
  species: Species;
  grew: boolean;
};

export type GardenTogetherState = {
  garden: GardenState;
  lastAction: GardenAction | null;
  /** Cuándo empezaron a cuidarlo (primera jugada), si ya tenía historia. */
  since: string | null;
};

type Payload = { index?: unknown; species?: unknown };

export function applyGardenEvent(state: GardenTogetherState, event: GameEvent): GardenTogetherState {
  const payload = (event.payload ?? {}) as Payload;
  const index = Number(payload.index);
  if (!Number.isInteger(index)) return state;

  let result: { garden: GardenState; event: GardenEvent };
  if (event.type === 'PLANT') {
    if (!SPECIES.includes(payload.species as Species)) return state;
    result = plantSeed(state.garden, index, payload.species as Species);
  } else if (event.type === 'WATER') {
    result = water(state.garden, index);
  } else {
    return state;
  }
  if (result.event === 'ignored' || result.event === 'already-bloomed') return state;

  const grown = growIfFull(result.garden);
  const plant = grown.garden.plots[index];
  return {
    garden: grown.garden,
    lastAction: plant ? { actorId: event.actorId, index, event: result.event, species: plant.species, grew: grown.grew } : null,
    since: state.since ?? event.createdAt,
  };
}

export function replayGardenTogether(history: GameEvent[], current: GameEvent[]): GardenTogetherState {
  const initial: GardenTogetherState = { garden: createGarden(), lastAction: null, since: null };
  const withHistory = history.reduce(applyGardenEvent, initial);
  const afterHistory = { ...withHistory, lastAction: null };
  return [...current].sort((a, b) => a.seq - b.seq).reduce(applyGardenEvent, afterHistory);
}

