import { describe, expect, it } from 'vitest';
import {
  PIECE_MARGIN,
  PUZZLE_SIZE,
  createPuzzle,
  gridSize,
  isComplete,
  piecePath,
  pieceViewBox,
  place,
  placedCount,
} from './puzzle';

function seeded(seed = 7) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

describe('puzzle', () => {
  it('cuts the board into size × size pieces with a shuffled tray', () => {
    expect(gridSize(9)).toBe(3);
    expect(gridSize(16)).toBe(4);
    expect(gridSize(25)).toBe(5);
    const puzzle = createPuzzle(16, seeded());
    expect(puzzle.pieces).toHaveLength(16);
    expect([...puzzle.tray].sort((a, b) => a - b)).toEqual(puzzle.pieces.map((piece) => piece.id));
    expect(puzzle.tray).not.toEqual(puzzle.pieces.map((piece) => piece.id));
    expect(puzzle.placed.every((value) => !value)).toBe(true);
  });

  it('has flat outer borders and matching tabs between neighbours', () => {
    const { pieces, size } = createPuzzle(25, seeded(3));
    const at = (row: number, col: number) => pieces[row * size + col];
    pieces.forEach((piece) => {
      if (piece.row === 0) expect(piece.edges.top).toBe(0);
      if (piece.row === size - 1) expect(piece.edges.bottom).toBe(0);
      if (piece.col === 0) expect(piece.edges.left).toBe(0);
      if (piece.col === size - 1) expect(piece.edges.right).toBe(0);
      if (piece.col < size - 1) {
        expect(piece.edges.right).not.toBe(0);
        expect(piece.edges.right).toBe(-at(piece.row, piece.col + 1).edges.left);
      }
      if (piece.row < size - 1) {
        expect(piece.edges.bottom).not.toBe(0);
        expect(piece.edges.bottom).toBe(-at(piece.row + 1, piece.col).edges.top);
      }
    });
  });

  it('only accepts a piece in its own place', () => {
    const puzzle = createPuzzle(9, seeded());
    const piece = puzzle.pieces[4];
    expect(place(puzzle, piece.id, 0, 0)).toEqual({ state: puzzle, result: 'wrong' });
    const { state, result } = place(puzzle, piece.id, piece.row, piece.col);
    expect(result).toBe('placed');
    expect(state.placed[piece.id]).toBe(true);
    expect(state.tray).not.toContain(piece.id);
    expect(placedCount(state)).toBe(1);
    expect(place(state, piece.id, piece.row, piece.col).result).toBe('ignored');
    expect(place(state, 99, 0, 0).result).toBe('ignored');
  });

  it('is complete when every piece is in place', () => {
    let puzzle = createPuzzle(9, seeded());
    puzzle.pieces.forEach((piece) => {
      puzzle = place(puzzle, piece.id, piece.row, piece.col).state;
    });
    expect(isComplete(puzzle)).toBe(true);
    expect(puzzle.tray).toHaveLength(0);
  });

  it('draws a closed outline inside the board, with room for the tabs', () => {
    const puzzle = createPuzzle(16, seeded());
    puzzle.pieces.forEach((piece) => {
      const path = piecePath(piece, puzzle.size);
      expect(path.startsWith('M ')).toBe(true);
      expect(path.endsWith('Z')).toBe(true);
      const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
      numbers.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(PUZZLE_SIZE);
      });
      const tabs = Object.values(piece.edges).filter((tab) => tab !== 0).length;
      expect((path.match(/C /g) ?? []).length).toBe(tabs * 2);
    });
    const box = pieceViewBox(puzzle.pieces[0], 4);
    expect(box.w).toBeCloseTo((PUZZLE_SIZE / 4) * (1 + PIECE_MARGIN * 2));
  });
});
