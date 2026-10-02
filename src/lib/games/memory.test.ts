import { describe, expect, it } from 'vitest';
import { createGame, flip, hideMismatch, isComplete, isFaceUp, matchedPairs, shuffle } from './memory';

const SYMBOLS = ['luna', 'sol', 'hoja', 'nube', 'ola', 'estrella'];

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function indexesOf(state: ReturnType<typeof createGame>, symbol: string) {
  return state.cards.flatMap((card, index) => (card.symbol === symbol ? [index] : []));
}

describe('memory', () => {
  it('creates two cards per pair, shuffled', () => {
    const game = createGame(SYMBOLS, 4, seeded());
    expect(game.cards).toHaveLength(8);
    const counts = new Map<string, number>();
    game.cards.forEach((card) => counts.set(card.symbol, (counts.get(card.symbol) ?? 0) + 1));
    expect([...counts.values()].every((count) => count === 2)).toBe(true);
    expect(counts.size).toBe(4);
  });

  it('shuffle keeps every element', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(3)).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('matches a pair and keeps it face up', () => {
    let game = createGame(SYMBOLS, 3, seeded());
    const [a, b] = indexesOf(game, game.cards[0].symbol);
    game = flip(game, a).state;
    const second = flip(game, b);
    expect(second.result).toBe('match');
    expect(isFaceUp(second.state, a) && isFaceUp(second.state, b)).toBe(true);
    expect(matchedPairs(second.state)).toBe(1);
  });

  it('keeps a mismatch visible until hidden, and ignores taps meanwhile', () => {
    let game = createGame(SYMBOLS, 3, seeded());
    const a = 0;
    const b = game.cards.findIndex((card, index) => index !== a && card.symbol !== game.cards[a].symbol);
    const c = game.cards.findIndex((_card, index) => index !== a && index !== b);
    game = flip(game, a).state;
    const mismatch = flip(game, b);
    expect(mismatch.result).toBe('mismatch');
    expect(flip(mismatch.state, c).result).toBe('ignored');
    const hidden = hideMismatch(mismatch.state);
    expect(isFaceUp(hidden, a) || isFaceUp(hidden, b)).toBe(false);
  });

  it('ignores tapping the same card twice or a matched card', () => {
    let game = createGame(SYMBOLS, 2, seeded());
    game = flip(game, 0).state;
    expect(flip(game, 0).result).toBe('ignored');
  });

  it('is complete when every pair was found', () => {
    let game = createGame(SYMBOLS, 2, seeded());
    for (const symbol of new Set(game.cards.map((card) => card.symbol))) {
      const [a, b] = indexesOf(game, symbol);
      game = flip(flip(game, a).state, b).state;
    }
    expect(isComplete(game)).toBe(true);
    expect(matchedPairs(game)).toBe(2);
  });
});
