import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../api/gameRooms';
import { BLOOM_STAGE, GARDEN_COLS, GARDEN_START_ROWS } from './garden';
import { replayGardenTogether } from './gardenTogether';

const A = 'facu';
const B = 'lu';
let n = 0;
function ev(actorId: string, type: string, payload: unknown, seq = ++n, roomId = 'r'): GameEvent {
  return { roomId, seq, actorId, type, payload, createdAt: `2026-10-0${roomId === 'old' ? 1 : 2}T12:00:00Z` };
}

describe('gardenTogether', () => {
  it('starts empty with no history', () => {
    const state = replayGardenTogether([], []);
    expect(state.garden.plots.every((plot) => plot === null)).toBe(true);
    expect(state.since).toBeNull();
    expect(state.lastAction).toBeNull();
  });

  it('keeps growing from earlier games, and remembers since when', () => {
    const history = [ev(A, 'PLANT', { index: 0, species: 'girasol' }, 1, 'old'), ev(B, 'WATER', { index: 0 }, 2, 'old')];
    const current = [ev(A, 'WATER', { index: 0 }, 1), ev(B, 'PLANT', { index: 5, species: 'lavanda' }, 2)];
    const state = replayGardenTogether(history, current);
    expect(state.garden.plots[0]).toEqual({ species: 'girasol', stage: 2 });
    expect(state.garden.plots[5]).toEqual({ species: 'lavanda', stage: 0 });
    expect(state.since).toBe('2026-10-01T12:00:00Z');
    expect(state.lastAction).toMatchObject({ actorId: B, index: 5, event: 'planted', species: 'lavanda' });
  });

  it('the last action comes only from this game, not from history', () => {
    const history = [ev(B, 'PLANT', { index: 1, species: 'tulipan' }, 1, 'old')];
    expect(replayGardenTogether(history, []).lastAction).toBeNull();
  });

  it('plays in seq order and ignores invalid moves', () => {
    const current = [
      ev(B, 'PLANT', { index: 2, species: 'margarita' }, 3),
      ev(A, 'PLANT', { index: 2, species: 'campanita' }, 1),
      ev(A, 'PLANT', { index: 3, species: 'cactus' }, 4),
      ev(A, 'WATER', { index: 7 }, 5),
      ev(A, 'DANCE', { index: 2 }, 6),
      ev(A, 'WATER', { index: 'x' }, 7),
    ];
    const state = replayGardenTogether([], current);
    expect(state.garden.plots[2]).toEqual({ species: 'campanita', stage: 0 });
    expect(state.garden.plots[3]).toBeNull();
    expect(state.lastAction).toMatchObject({ actorId: A, index: 2, event: 'planted' });
  });

  it('blooms and grows a new row when everything is in flower', () => {
    const plots = GARDEN_START_ROWS * GARDEN_COLS;
    const current: GameEvent[] = [];
    for (let i = 0; i < plots; i += 1) {
      current.push(ev(i % 2 ? A : B, 'PLANT', { index: i, species: 'margarita' }));
      for (let w = 0; w < BLOOM_STAGE; w += 1) current.push(ev(i % 2 ? B : A, 'WATER', { index: i }));
    }
    const state = replayGardenTogether([], current);
    expect(state.garden.rows).toBe(GARDEN_START_ROWS + 1);
    expect(state.lastAction).toMatchObject({ event: 'bloomed', grew: true });
  });
});
