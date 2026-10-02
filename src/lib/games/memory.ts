/**
 * Memoria: lógica pura (sin React). Sin reloj, sin puntaje ni movimientos
 * contados: el único progreso es cuántas parejas encontraste.
 */
export type MemoryCard = {
  id: number;
  /** Símbolo compartido por las dos cartas de la pareja. */
  symbol: string;
  matched: boolean;
};

export type MemoryState = {
  cards: MemoryCard[];
  /** Índices boca arriba que todavía no se resolvieron (0, 1 o 2). */
  flipped: number[];
};

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGame(symbols: string[], pairs: number, rng: Rng = Math.random): MemoryState {
  if (pairs > symbols.length) throw new Error('No hay suficientes símbolos para esas parejas');
  const chosen = shuffle(symbols, rng).slice(0, pairs);
  const deck = shuffle([...chosen, ...chosen], rng).map((symbol, id) => ({ id, symbol, matched: false }));
  return { cards: deck, flipped: [] };
}

export function isFaceUp(state: MemoryState, index: number): boolean {
  return state.cards[index].matched || state.flipped.includes(index);
}

/** Hay dos cartas boca arriba que no son pareja: hay que esperar a que se den vuelta. */
export function isWaiting(state: MemoryState): boolean {
  return state.flipped.length === 2;
}

/**
 * Da vuelta una carta. Si es la segunda y forman pareja, quedan resueltas.
 * Si no son pareja quedan boca arriba hasta `hideMismatch` (la UI decide cuándo).
 */
export function flip(state: MemoryState, index: number): { state: MemoryState; result: 'flipped' | 'match' | 'mismatch' | 'ignored' } {
  const card = state.cards[index];
  if (!card || isFaceUp(state, index) || isWaiting(state)) return { state, result: 'ignored' };

  if (state.flipped.length === 0) {
    return { state: { ...state, flipped: [index] }, result: 'flipped' };
  }

  const [first] = state.flipped;
  if (state.cards[first].symbol === card.symbol) {
    const cards = state.cards.map((c, i) => (i === first || i === index ? { ...c, matched: true } : c));
    return { state: { cards, flipped: [] }, result: 'match' };
  }
  return { state: { ...state, flipped: [first, index] }, result: 'mismatch' };
}

export function hideMismatch(state: MemoryState): MemoryState {
  return isWaiting(state) ? { ...state, flipped: [] } : state;
}

export function matchedPairs(state: MemoryState): number {
  return state.cards.filter((card) => card.matched).length / 2;
}

export function isComplete(state: MemoryState): boolean {
  return state.cards.every((card) => card.matched);
}
