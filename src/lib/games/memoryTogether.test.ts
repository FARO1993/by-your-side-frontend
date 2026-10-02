import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../../api/gameRooms';
import { isComplete, matchedPairs } from './memory';
import { TOGETHER_PAIRS, initialTogether, replayTogether } from './memoryTogether';
import { seededRandom } from './seededRandom';

const HOST = 'host-id';
const GUEST = 'guest-id';
const SEED = 424242;

function ev(seq: number, actorId: string, type: string, payload: unknown): GameEvent {
  return { roomId: 'r', seq, actorId, type, payload, createdAt: '' };
}

/** Índices de una pareja y de dos cartas que NO son pareja, según el mazo de la semilla. */
function layout() {
  const { game } = initialTogether(SEED);
  const first = game.cards[0].symbol;
  const pair = game.cards.findIndex((card, i) => i > 0 && card.symbol === first);
  const notPair = game.cards.findIndex((card) => card.symbol !== first);
  return { pair: [0, pair] as const, mismatch: [0, notPair] as const, game };
}

describe('seededRandom', () => {
  it('gives the same sequence for the same seed', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    const c = seededRandom(8);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
    seqA.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    });
  });
});

describe('memoryTogether', () => {
  it('builds the same board on both sides from the seed', () => {
    expect(initialTogether(SEED).game).toEqual(initialTogether(SEED).game);
    expect(initialTogether(SEED).game.cards).toHaveLength(TOGETHER_PAIRS * 2);
    expect(initialTogether(SEED).turn).toBe('host');
  });

  it('takes turns: two cards each, whatever happens', () => {
    const { pair, mismatch } = layout();
    let state = replayTogether(SEED, HOST, [ev(1, HOST, 'FLIP', { index: mismatch[0] }), ev(2, HOST, 'FLIP', { index: mismatch[1] })]);
    expect(state.turn).toBe('guest');
    expect(state.mismatchSeq).toBe(2);
    expect(state.game.flipped).toEqual([...mismatch]);

    // El turno siguiente esconde las dos distintas y sigue.
    state = replayTogether(SEED, HOST, [
      ev(1, HOST, 'FLIP', { index: mismatch[0] }),
      ev(2, HOST, 'FLIP', { index: mismatch[1] }),
      ev(3, GUEST, 'FLIP', { index: pair[0] }),
      ev(4, GUEST, 'FLIP', { index: pair[1] }),
    ]);
    expect(matchedPairs(state.game)).toBe(1);
    expect(state.turn).toBe('host');
    expect(state.mismatchSeq).toBeNull();
  });

  it('ignores moves out of turn the same way on both sides', () => {
    const { pair } = layout();
    const state = replayTogether(SEED, HOST, [ev(1, GUEST, 'FLIP', { index: pair[0] })]);
    expect(state.game.flipped).toEqual([]);
    expect(state.turn).toBe('host');
    expect(state.seq).toBe(1);
  });

  it('applies events in seq order and only once', () => {
    const { pair } = layout();
    const events = [ev(2, HOST, 'FLIP', { index: pair[1] }), ev(1, HOST, 'FLIP', { index: pair[0] }), ev(1, HOST, 'FLIP', { index: pair[0] })];
    expect(matchedPairs(replayTogether(SEED, HOST, events).game)).toBe(1);
  });

  it('can be finished together and restarted with a new board', () => {
    const { game } = initialTogether(SEED);
    const bySymbol = new Map<string, number[]>();
    game.cards.forEach((card, i) => bySymbol.set(card.symbol, [...(bySymbol.get(card.symbol) ?? []), i]));
    const events: GameEvent[] = [];
    let seat = HOST;
    [...bySymbol.values()].forEach(([a, b]) => {
      events.push(ev(events.length + 1, seat, 'FLIP', { index: a }));
      events.push(ev(events.length + 1, seat, 'FLIP', { index: b }));
      seat = seat === HOST ? GUEST : HOST;
    });
    const done = replayTogether(SEED, HOST, events);
    expect(isComplete(done.game)).toBe(true);

    const restarted = replayTogether(SEED, HOST, [
      ...events,
      ev(events.length + 1, GUEST, 'RESTART', { round: 1 }),
      ev(events.length + 2, HOST, 'RESTART', { round: 1 }),
    ]);
    expect(restarted.round).toBe(1);
    expect(matchedPairs(restarted.game)).toBe(0);
    expect(restarted.game.cards.map((c) => c.symbol)).not.toEqual(game.cards.map((c) => c.symbol));
  });
});
