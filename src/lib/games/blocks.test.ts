import { describe, expect, it } from 'vitest';
import {
  COLS,
  PIECE_KINDS,
  ROWS,
  createBlocksGame,
  drop,
  emptyBoard,
  fits,
  landingY,
  move,
  rotate,
  rotateCells,
  shapeOf,
  step,
  type BlocksState,
  type PieceKind,
} from './blocks';

function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function withActive(kind: PieceKind, x: number, y: number, board = emptyBoard()): BlocksState {
  return {
    board,
    active: { kind, cells: shapeOf(kind), x, y },
    next: 'O4',
    bag: [],
    linesCleared: 0,
    over: false,
  };
}

describe('blocks', () => {
  it('starts on an 8×14 board with a centered piece', () => {
    const game = createBlocksGame(seeded());
    expect(game.board).toHaveLength(ROWS);
    expect(game.board[0]).toHaveLength(COLS);
    expect(game.active.y).toBe(0);
    expect(fits(game.board, game.active.cells, game.active.x, game.active.y)).toBe(true);
  });

  it('deals every piece once per bag', () => {
    const rng = seeded(3);
    let game = createBlocksGame(rng);
    const seen: PieceKind[] = [game.active.kind];
    while (seen.length < PIECE_KINDS.length) {
      // Se vacía el tablero entre piezas: acá solo importa el orden de reparto.
      game = { ...drop(game, rng).state, board: emptyBoard(), over: false };
      seen.push(game.active.kind);
    }
    expect(new Set(seen).size).toBe(PIECE_KINDS.length);
  });

  it('moves sideways but not through walls', () => {
    let game = withActive('O4', 0, 0);
    game = move(game, -1);
    expect(game.active.x).toBe(0);
    game = move(game, 1);
    expect(game.active.x).toBe(1);
    game = withActive('O4', COLS - 2, 0);
    expect(move(game, 1).active.x).toBe(COLS - 2);
  });

  it('rotates clockwise and kicks off the wall', () => {
    expect(rotateCells(shapeOf('I3'))).toEqual([[0, 0], [0, 1], [0, 2]]);
    // I4 vertical contra la pared derecha: al rotar a horizontal se corre hacia adentro.
    const vertical = { ...withActive('I4', COLS - 1, 0) };
    vertical.active = { ...vertical.active, cells: rotateCells(shapeOf('I4')) };
    const rotated = rotate(vertical);
    const sorted = (cells: readonly (readonly [number, number])[]) => [...cells].map((c) => c.join(',')).sort();
    expect(sorted(rotated.active.cells)).toEqual(sorted(shapeOf('I4')));
    expect(fits(rotated.board, rotated.active.cells, rotated.active.x, rotated.active.y)).toBe(true);
  });

  it('falls one row per step and locks at the bottom', () => {
    let game = withActive('O4', 3, ROWS - 3);
    let result = step(game);
    expect(result.locked).toBe(false);
    expect(result.state.active.y).toBe(ROWS - 2);
    game = result.state;
    result = step(game);
    expect(result.locked).toBe(true);
    expect(result.state.board[ROWS - 1][3]).toBe('presence');
    expect(result.state.active.y).toBe(0);
  });

  it('shows where the piece would land', () => {
    const board = emptyBoard();
    board[ROWS - 1][3] = 'listening';
    expect(landingY(withActive('O4', 3, 0, board))).toBe(ROWS - 3);
  });

  it('clears full rows and lets the rest fall', () => {
    const board = emptyBoard();
    for (let x = 0; x < COLS; x += 1) if (x !== 3 && x !== 4) board[ROWS - 1][x] = 'listening';
    board[ROWS - 2][0] = 'presence';
    const { state, cleared } = drop(withActive('O4', 3, 0, board));
    expect(cleared).toBe(1);
    expect(state.linesCleared).toBe(1);
    // La fila de arriba bajó: el bloque suelto y la mitad superior del O quedan en la última fila.
    expect(state.board[ROWS - 1][0]).toBe('presence');
    expect(state.board[ROWS - 1][3]).toBe('presence');
    expect(state.board[ROWS - 1][1]).toBeNull();
  });

  it('ends gently when a new piece no longer fits', () => {
    const board = emptyBoard();
    for (let y = 1; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) if (x !== 0) board[y][x] = 'presence';
    const result = step(withActive('I3', 0, 0, board));
    expect(result.state.over).toBe(true);
    expect(step(result.state).state).toBe(result.state);
  });
});
