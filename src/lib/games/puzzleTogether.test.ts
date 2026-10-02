import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../api/gameRooms';
import { isComplete, placedCount } from './puzzle';
import { puzzleForRound, replayPuzzleTogether } from './puzzleTogether';

const HOST = 'host-id';
const GUEST = 'guest-id';
const SEED = 777;

function ev(seq: number, actorId: string, type: string, payload: unknown): GameEvent {
  return { roomId: 'r', seq, actorId, type, payload, createdAt: '' };
}

const setup = (seq: number, actor = HOST, round = 1, scene = 'noche', count = 9) =>
  ev(seq, actor, 'SETUP', { round, scene, count });

describe('puzzleTogether', () => {
  it('waits for someone to choose, and both sides build the same puzzle', () => {
    expect(replayPuzzleTogether(SEED, HOST, []).puzzle).toBeNull();
    const state = replayPuzzleTogether(SEED, HOST, [setup(1, GUEST)]);
    expect(state.round).toBe(1);
    expect(state.setup).toEqual({ scene: 'noche', count: 9 });
    expect(state.puzzle).toEqual(puzzleForRound(SEED, 1, 9));
  });

  it('keeps the first choice when both choose at the same time', () => {
    const state = replayPuzzleTogether(SEED, HOST, [setup(1, HOST, 1, 'lago', 9), setup(2, GUEST, 1, 'jardin', 16)]);
    expect(state.setup).toEqual({ scene: 'lago', count: 9 });
  });

  it('ignores a broken or out-of-order setup', () => {
    expect(replayPuzzleTogether(SEED, HOST, [ev(1, HOST, 'SETUP', { round: 1, scene: 'mar', count: 9 })]).puzzle).toBeNull();
    expect(replayPuzzleTogether(SEED, HOST, [ev(1, HOST, 'SETUP', { round: 1, scene: 'lago', count: 7 })]).puzzle).toBeNull();
    expect(replayPuzzleTogether(SEED, HOST, [setup(1, HOST, 3)]).puzzle).toBeNull();
  });

  it('lets both place pieces with no turns, and duplicates count once', () => {
    const events = [
      setup(1),
      ev(2, HOST, 'PLACE', { round: 1, pieceId: 0 }),
      ev(3, GUEST, 'PLACE', { round: 1, pieceId: 4 }),
      ev(4, GUEST, 'PLACE', { round: 1, pieceId: 4 }),
      ev(5, GUEST, 'PLACE', { round: 9, pieceId: 5 }),
      ev(6, GUEST, 'PLACE', { round: 1, pieceId: 99 }),
    ];
    const state = replayPuzzleTogether(SEED, HOST, events);
    expect(placedCount(state.puzzle!)).toBe(2);
    expect(state.lastPlaced).toEqual({ pieceId: 4, by: 'guest' });
  });

  it('shows what each person is holding, and lets go when that piece is placed', () => {
    let state = replayPuzzleTogether(SEED, HOST, [setup(1), ev(2, GUEST, 'HOLD', { round: 1, pieceId: 3 })]);
    expect(state.held).toEqual({ host: null, guest: 3 });
    state = replayPuzzleTogether(SEED, HOST, [
      setup(1),
      ev(2, GUEST, 'HOLD', { round: 1, pieceId: 3 }),
      ev(3, HOST, 'PLACE', { round: 1, pieceId: 3 }),
      ev(4, HOST, 'HOLD', { round: 1, pieceId: 3 }),
    ]);
    expect(state.held).toEqual({ host: null, guest: null });
    state = replayPuzzleTogether(SEED, HOST, [setup(1), ev(2, GUEST, 'HOLD', { round: 1, pieceId: 3 }), ev(3, GUEST, 'HOLD', { round: 1, pieceId: null })]);
    expect(state.held.guest).toBeNull();
  });

  it('starts another round only once the current puzzle is done', () => {
    const placeAll = Array.from({ length: 9 }, (_, i) => ev(2 + i, i % 2 ? GUEST : HOST, 'PLACE', { round: 1, pieceId: i }));
    const midway = replayPuzzleTogether(SEED, HOST, [setup(1), placeAll[0], setup(3, GUEST, 2, 'jardin', 16)]);
    expect(midway.round).toBe(1);

    const done = replayPuzzleTogether(SEED, HOST, [setup(1), ...placeAll]);
    expect(isComplete(done.puzzle!)).toBe(true);
    const next = replayPuzzleTogether(SEED, HOST, [setup(1), ...placeAll, setup(20, GUEST, 2, 'jardin', 16)]);
    expect(next.round).toBe(2);
    expect(next.setup).toEqual({ scene: 'jardin', count: 16 });
    expect(placedCount(next.puzzle!)).toBe(0);
    expect(next.puzzle).toEqual(puzzleForRound(SEED, 2, 16));
  });
});
