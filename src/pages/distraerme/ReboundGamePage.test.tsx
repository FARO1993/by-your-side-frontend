import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as rebound from '../../lib/games/rebound';
import ReboundGamePage from './ReboundGamePage';

function renderGame() {
  render(
    <MemoryRouter>
      <ReboundGamePage />
    </MemoryRouter>,
  );
}

function frames(count: number) {
  act(() => {
    vi.advanceTimersByTime(16 * count);
  });
}

describe('ReboundGamePage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits for the player before the ball moves', () => {
    const advanceSpy = vi.spyOn(rebound, 'advance');
    renderGame();
    expect(screen.getByText('Cuando quieras')).toBeInTheDocument();
    expect(screen.getByText(`0 de ${rebound.BRICK_ROWS * rebound.BRICK_COLS} ladrillos`)).toBeInTheDocument();
    frames(10);
    expect(advanceSpy).not.toHaveBeenCalled();
  });

  it('runs the game loop once started', () => {
    const advanceSpy = vi.spyOn(rebound, 'advance');
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    frames(5);
    expect(advanceSpy).toHaveBeenCalled();
    expect(screen.queryByText('Cuando quieras')).not.toBeInTheDocument();
  });

  it('moves the paddle with the arrows and by dragging over the field', () => {
    const advanceSpy = vi.spyOn(rebound, 'advance');
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    frames(3);
    expect(advanceSpy.mock.lastCall?.[2]).toEqual({ dir: -1, target: null });
    fireEvent.keyUp(window, { key: 'ArrowLeft' });

    const field = screen.getByTestId('rebound-field');
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 200, height: 280, right: 200, bottom: 280, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerMove(field, { clientX: 50 });
    frames(3);
    expect(advanceSpy.mock.lastCall?.[2]).toEqual({ dir: 0, target: 25 });
  });

  it('pauses with P, with the button, and when the tab is hidden', () => {
    const advanceSpy = vi.spyOn(rebound, 'advance');
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));

    fireEvent.keyDown(window, { key: 'p' });
    expect(screen.getByText('En pausa')).toBeInTheDocument();
    advanceSpy.mockClear();
    frames(10);
    expect(advanceSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: /Seguir/ })[0]);
    expect(screen.queryByText('En pausa')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Pausa/ }));
    expect(screen.getByText('En pausa')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Seguir/ })[0]);

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.getByText('En pausa')).toBeInTheDocument();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  });

  it('ends gently when the wall is cleared, and can start again', () => {
    const real = rebound.advance;
    const spy = vi.spyOn(rebound, 'advance').mockImplementation((state) => ({ ...state, bricks: [], cleared: true }));
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    frames(3);
    expect(screen.getByText('Despejaste la pared')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Despejaste toda la pared.');
    expect(screen.queryByRole('button', { name: /Pausa/ })).not.toBeInTheDocument();

    spy.mockImplementation(real);
    fireEvent.click(screen.getByRole('button', { name: 'Otra' }));
    expect(screen.queryByText('Despejaste la pared')).not.toBeInTheDocument();
    expect(screen.getByText(`0 de ${rebound.BRICK_ROWS * rebound.BRICK_COLS} ladrillos`)).toBeInTheDocument();
  });
});
