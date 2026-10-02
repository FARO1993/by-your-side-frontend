import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOOM_STAGE, GARDEN_COLS, GARDEN_START_ROWS, createGarden, type GardenState } from '../../lib/games/garden';
import { loadGarden, saveGarden } from '../../lib/games/gardenStorage';
import GardenGamePage from './GardenGamePage';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

function renderGarden() {
  render(
    <MemoryRouter initialEntries={['/distraerme/jardin']}>
      <Routes>
        <Route path="/distraerme/jardin" element={<GardenGamePage />} />
        <Route path="/distraerme" element={<p>Hub de Distraerme</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const plot = (n: number) => screen.getByRole('button', { name: new RegExp(`^Cantero ${n}[,:]`) });

describe('GardenGamePage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty garden and a seed ready to plant', () => {
    renderGarden();
    expect(screen.getAllByRole('button', { name: /^Cantero \d+, vacío/ })).toHaveLength(GARDEN_START_ROWS * GARDEN_COLS);
    expect(screen.getByRole('button', { name: /Margarita/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/nada se marchita/)).toBeInTheDocument();
  });

  it('plants the chosen seed, waters it until it blooms, and remembers it', () => {
    renderGarden();
    fireEvent.click(screen.getByRole('button', { name: /Tulipán/ }));
    fireEvent.click(plot(1));
    expect(screen.getByRole('status')).toHaveTextContent('Plantaste un tulipán.');
    expect(plot(1)).toHaveAccessibleName('Cantero 1: Tulipán, semilla. Regar');

    fireEvent.click(plot(1));
    expect(screen.getByRole('status')).toHaveTextContent('Regaste. Ahora es brote.');
    fireEvent.click(plot(1));
    fireEvent.click(plot(1));
    expect(screen.getByRole('status')).toHaveTextContent('¡Floreció un tulipán!');
    expect(plot(1)).toHaveAccessibleName('Cantero 1: Tulipán, en flor');
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(loadGarden('u1')?.plots[0]).toEqual({ species: 'tulipan', stage: BLOOM_STAGE });
  });

  it('grows a new row when every plot is in bloom', () => {
    const almost: GardenState = {
      ...createGarden(),
      plots: createGarden().plots.map((_, i) => ({ species: 'margarita' as const, stage: i === 0 ? BLOOM_STAGE - 1 : BLOOM_STAGE })),
    };
    saveGarden('u1', almost);
    renderGarden();
    expect(screen.getAllByTestId('garden-visitor').length).toBeGreaterThan(0);
    fireEvent.click(plot(1));
    expect(screen.getByRole('status')).toHaveTextContent('El jardín creció: hay canteros nuevos.');
    expect(screen.getAllByRole('button', { name: /^Cantero \d+, vacío/ })).toHaveLength(GARDEN_COLS);
  });

  it('closes the session gently and keeps the garden', () => {
    renderGarden();
    fireEvent.click(plot(2));
    fireEvent.click(screen.getByRole('button', { name: 'Terminar por hoy' }));
    expect(screen.getByText('Gracias por compartir este ratito 🌱')).toBeInTheDocument();
    expect(screen.getByText(/Hoy plantaste una semilla\./)).toBeInTheDocument();
    expect(plot(2)).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Seguir un rato más' }));
    expect(plot(1)).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Terminar por hoy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elegir otro juego' }));
    expect(screen.getByText('Hub de Distraerme')).toBeInTheDocument();
    expect(loadGarden('u1')?.plots[1]).toEqual({ species: 'margarita', stage: 0 });
  });

  it('has a kind word even if nothing was planted', () => {
    renderGarden();
    fireEvent.click(screen.getByRole('button', { name: 'Terminar por hoy' }));
    expect(screen.getByText(/A veces alcanza con pasar a mirar\./)).toBeInTheDocument();
  });
});
