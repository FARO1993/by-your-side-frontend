import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as puzzleLib from '../../lib/games/puzzle';
import PuzzleGamePage from './PuzzleGamePage';

function renderPuzzle() {
  render(
    <MemoryRouter>
      <PuzzleGamePage />
    </MemoryRouter>,
  );
}

/** Puzzle con la bandeja en orden, para saber qué pieza es cuál. */
const realCreatePuzzle = puzzleLib.createPuzzle;
function orderedPuzzle(count: puzzleLib.PieceCount) {
  const real = realCreatePuzzle(count, () => 0.3);
  return { ...real, tray: real.pieces.map((piece) => piece.id) };
}

function trayPieces() {
  return within(screen.getByRole('list', { name: 'Piezas sueltas' })).getAllByRole('button');
}

describe('PuzzleGamePage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('lets you choose the image and how many pieces before starting', () => {
    renderPuzzle();
    expect(screen.getByRole('button', { name: /Lago al atardecer/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Noche de campo/ }));
    expect(screen.getByRole('button', { name: /Noche de campo/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '16 piezas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(trayPieces()).toHaveLength(16);
    expect(screen.getByText('0 de 16 piezas')).toBeInTheDocument();
    expect(screen.getByText(/Noche de campo\. Arrastrá/)).toBeInTheDocument();
  });

  it('places a piece by tapping it and then its spot; a wrong spot just sends it back', () => {
    vi.spyOn(puzzleLib, 'createPuzzle').mockImplementation((count) => orderedPuzzle(count));
    renderPuzzle();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));

    const first = trayPieces()[0];
    expect(first).toHaveAccessibleName('Pieza 1, esquina');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Fila 3, columna 3' }));
    expect(screen.getByRole('status')).toHaveTextContent('Esa pieza va en otro lugar.');
    expect(trayPieces()).toHaveLength(9);

    fireEvent.click(screen.getByRole('button', { name: 'Fila 1, columna 1' }));
    expect(screen.getByRole('status')).toHaveTextContent('Encajó. 1 de 9.');
    expect(trayPieces()).toHaveLength(8);
    expect(screen.getByText('1 de 9 piezas')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Lugares del tablero' })).not.toBeInTheDocument();
  });

  it('places a piece by dragging it onto the board', () => {
    vi.spyOn(puzzleLib, 'createPuzzle').mockImplementation((count) => orderedPuzzle(count));
    renderPuzzle();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    vi.spyOn(screen.getByTestId('puzzle-board'), 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 300, height: 300, right: 300, bottom: 300, x: 0, y: 0, toJSON: () => ({}),
    });

    // Pieza 5 = la del centro (fila 2, columna 2).
    const center = trayPieces()[4];
    fireEvent.pointerDown(center, { pointerId: 1, button: 0, clientX: 500, clientY: 500 });
    fireEvent.pointerMove(center, { pointerId: 1, clientX: 160, clientY: 150 });
    fireEvent.pointerUp(center, { pointerId: 1, clientX: 150, clientY: 150 });
    fireEvent.click(center);

    expect(screen.getByRole('status')).toHaveTextContent('Encajó. 1 de 9.');
    expect(trayPieces()).toHaveLength(8);
    expect(trayPieces().some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(false);
  });

  it('ends gently when the last piece fits', () => {
    vi.spyOn(puzzleLib, 'createPuzzle').mockImplementation((count) => orderedPuzzle(count));
    renderPuzzle();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    for (let row = 1; row <= 3; row += 1) {
      for (let col = 1; col <= 3; col += 1) {
        fireEvent.click(trayPieces()[0]);
        fireEvent.click(screen.getByRole('button', { name: `Fila ${row}, columna ${col}` }));
      }
    }
    expect(screen.getByText('Armaste el paisaje')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Armaste el paisaje.');
    fireEvent.click(screen.getByRole('button', { name: 'Otro puzzle' }));
    expect(screen.getByText('Elegí una imagen')).toBeInTheDocument();
  });
});
