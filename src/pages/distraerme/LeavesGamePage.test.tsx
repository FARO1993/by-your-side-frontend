import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEAF_FLOAT_MS } from '../../lib/games/leaves';
import LeavesGamePage from './LeavesGamePage';

function renderRiver() {
  render(
    <MemoryRouter>
      <LeavesGamePage />
    </MemoryRouter>,
  );
}

function release(text: string) {
  fireEvent.change(screen.getByLabelText('¿Qué pensamiento aparece?'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Ponerlo en una hoja' }));
}

describe('LeavesGamePage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('puts a thought on a leaf that floats away and then is gone', () => {
    renderRiver();
    expect(screen.getByRole('button', { name: 'Ponerlo en una hoja' })).toBeDisabled();
    release('  no voy a llegar   con todo ');

    expect(screen.getByTestId('leaf')).toHaveTextContent('no voy a llegar con todo');
    expect(screen.getByLabelText('¿Qué pensamiento aparece?')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('Se va con el río');

    act(() => {
      vi.advanceTimersByTime(LEAF_FLOAT_MS + 600);
    });
    expect(screen.queryByTestId('leaf')).not.toBeInTheDocument();
    expect(screen.queryByText(/no voy a llegar/)).not.toBeInTheDocument();
  });

  it('never stores or sends what you write', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderRiver();
    release('algo muy mío');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(setItem.mock.calls.some(([, value]) => String(value).includes('algo muy mío'))).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps a gentle offer of help visible after releasing something heavy', () => {
    renderRiver();
    release('no quiero vivir más');
    expect(screen.getByText(/Eso que soltaste suena muy pesado/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Hablar ahora \(135\)/ })).toHaveAttribute('href', 'tel:135');
    fireEvent.click(screen.getByRole('button', { name: 'Seguir en el río' }));
    expect(screen.queryByText(/Eso que soltaste suena muy pesado/)).not.toBeInTheDocument();
  });

  it('does not show the help offer for everyday thoughts', () => {
    renderRiver();
    release('me muero de sueño');
    expect(screen.queryByText(/Eso que soltaste suena muy pesado/)).not.toBeInTheDocument();
  });

  it('ends with a kind word and clears the river', () => {
    renderRiver();
    release('la reunión de mañana');
    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(screen.getByText('Los pensamientos vienen y van')).toBeInTheDocument();
    expect(screen.queryByTestId('leaf')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Seguir mirando el río' }));
    expect(screen.getByLabelText('¿Qué pensamiento aparece?')).toBeInTheDocument();
  });
});
