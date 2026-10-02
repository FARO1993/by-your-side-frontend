import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as blocks from '../../lib/games/blocks';
import { BLOCKS_GRAVITY_MS } from '../../lib/games/blocksTiming';
import BlocksGamePage from './BlocksGamePage';

function renderGame() {
  render(
    <MemoryRouter>
      <BlocksGamePage />
    </MemoryRouter>,
  );
}

describe('BlocksGamePage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits for the player before anything falls', () => {
    const stepSpy = vi.spyOn(blocks, 'step');
    renderGame();
    expect(screen.getByText('Cuando quieras')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mover a la izquierda' })).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(BLOCKS_GRAVITY_MS * 5);
    });
    expect(stepSpy).not.toHaveBeenCalled();
  });

  it('falls at a constant pace once started', () => {
    const stepSpy = vi.spyOn(blocks, 'step');
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    act(() => {
      vi.advanceTimersByTime(BLOCKS_GRAVITY_MS * 3);
    });
    expect(stepSpy).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: 'Mover a la izquierda' })).toBeEnabled();
  });

  it('pauses with P, with the button, and when the tab is hidden', () => {
    const stepSpy = vi.spyOn(blocks, 'step');
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));

    fireEvent.keyDown(window, { key: 'p' });
    expect(screen.getByText('En pausa')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(BLOCKS_GRAVITY_MS * 3);
    });
    expect(stepSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: /Seguir/ })[0]);
    expect(screen.queryByText('En pausa')).not.toBeInTheDocument();

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByText('En pausa')).toBeInTheDocument();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });

  it('moves with the arrow keys and the touch controls', () => {
    const moveSpy = vi.spyOn(blocks, 'move');
    const rotateSpy = vi.spyOn(blocks, 'rotate');
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.click(screen.getByRole('button', { name: 'Mover a la derecha' }));
    expect(moveSpy).toHaveBeenCalledWith(expect.anything(), -1);
    expect(moveSpy).toHaveBeenCalledWith(expect.anything(), 1);
    expect(rotateSpy).toHaveBeenCalled();
  });

  it('ends gently, without "game over", and offers another round', () => {
    const real = blocks.createBlocksGame();
    vi.spyOn(blocks, 'createBlocksGame').mockReturnValueOnce({ ...real, over: true, linesCleared: 2 });
    renderGame();
    expect(screen.getByText('Se llenó el tablero')).toBeInTheDocument();
    expect(screen.getByText(/Completaste 2 filas. Fue un rato para vos/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Se llenó el tablero. Completaste 2 filas.');
    expect(screen.queryByText(/game over|perdiste/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Otra' }));
    expect(screen.queryByText('Se llenó el tablero')).not.toBeInTheDocument();
  });
});
