import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGame } from '../../lib/games/memory';
import MemoryGamePage, { MEMORY_SYMBOL_KEYS, MISMATCH_DELAY_MS } from './MemoryGamePage';

// Mazo determinista: con Math.random fijo, la página y el test arman el mismo mazo.
function expectedDeck(pairs = 6) {
  return createGame(MEMORY_SYMBOL_KEYS, pairs).cards;
}

function renderGame() {
  render(
    <MemoryRouter>
      <MemoryGamePage />
    </MemoryRouter>,
  );
}

const board = () => within(screen.getByRole('group', { name: /Tablero de/ }));
const card = (index: number) => board().getAllByRole('button')[index];

describe('MemoryGamePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => ((n++ * 0.6180339887) % 1));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts with 12 face-down cards and no timer', () => {
    renderGame();
    const cards = board().getAllByRole('button');
    expect(cards).toHaveLength(12);
    expect(cards.every((c) => /boca abajo/.test(c.getAttribute('aria-label') ?? ''))).toBe(true);
    expect(screen.queryByText(/tiempo|segundos|puntos/i)).not.toBeInTheDocument();
  });

  it('turns a mismatch back after a moment and announces it', () => {
    renderGame();
    vi.restoreAllMocks();
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => ((n++ * 0.6180339887) % 1));
    const deck = expectedDeck();
    const other = deck.findIndex((c) => c.symbol !== deck[0].symbol);

    fireEvent.click(card(0));
    fireEvent.click(card(other));
    expect(screen.getByRole('status')).toHaveTextContent('No eran pareja');
    expect(card(0)).not.toHaveAccessibleName(/boca abajo/);

    act(() => {
      vi.advanceTimersByTime(MISMATCH_DELAY_MS);
    });
    expect(card(0)).toHaveAccessibleName(/boca abajo/);
    expect(card(other)).toHaveAccessibleName(/boca abajo/);
  });

  it('lets you find every pair and celebrates without scores', () => {
    renderGame();
    vi.restoreAllMocks();
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => ((n++ * 0.6180339887) % 1));
    const deck = expectedDeck();
    const done = new Set<number>();
    deck.forEach((c, i) => {
      if (done.has(i)) return;
      const j = deck.findIndex((d, k) => k !== i && d.symbol === c.symbol);
      fireEvent.click(card(i));
      fireEvent.click(card(j));
      done.add(i).add(j);
    });
    expect(screen.getByText('Encontraste todas las parejas')).toBeInTheDocument();
    expect(screen.getByText('No se trataba de ganar: fue un rato para vos.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Encontraste todas las parejas');
  });

  it('switches to 8 pairs', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: '8 parejas' }));
    expect(within(screen.getByRole('group', { name: 'Tablero de 8 parejas' })).getAllByRole('button')).toHaveLength(16);
    expect(screen.getByRole('button', { name: '8 parejas' })).toHaveAttribute('aria-pressed', 'true');
  });
});
