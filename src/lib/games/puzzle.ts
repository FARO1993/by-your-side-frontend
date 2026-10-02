/**
 * Puzzle: piezas con forma de rompecabezas que se colocan en su lugar.
 * Sin reloj ni contador de movimientos: una pieza que no va ahí simplemente
 * vuelve a la bandeja.
 *
 * Lógica pura: el tablero mide PUZZLE_SIZE × PUZZLE_SIZE unidades (lo mismo
 * que las ilustraciones) y se divide en size × size piezas.
 */
export const PUZZLE_SIZE = 300;
export const PIECE_COUNTS = [9, 16, 25] as const;
export type PieceCount = (typeof PIECE_COUNTS)[number];

/** Cuánto sobresale una lengüeta, en proporción al lado de la pieza. */
export const TAB_DEPTH = 0.22;
/** Margen alrededor de cada pieza para que entren las lengüetas. */
export const PIECE_MARGIN = 0.26;

/** 1 = lengüeta hacia afuera, -1 = hueco hacia adentro, 0 = borde liso. */
export type Tab = -1 | 0 | 1;
export type PieceEdges = { top: Tab; right: Tab; bottom: Tab; left: Tab };

export type Piece = { id: number; row: number; col: number; edges: PieceEdges };

export type PuzzleState = {
  size: number;
  pieces: Piece[];
  placed: boolean[];
  /** Orden en que se muestran las piezas sueltas (mezcladas). */
  tray: number[];
};

export type PlaceResult = 'placed' | 'wrong' | 'ignored';

export function gridSize(count: PieceCount): number {
  return Math.round(Math.sqrt(count));
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createPuzzle(count: PieceCount, rng: () => number = Math.random): PuzzleState {
  const size = gridSize(count);
  const sign = (): Tab => (rng() < 0.5 ? 1 : -1);
  // horizontal[r][c]: borde entre (r, c) y (r + 1, c). vertical[r][c]: entre (r, c) y (r, c + 1).
  const horizontal = Array.from({ length: size - 1 }, () => Array.from({ length: size }, sign));
  const vertical = Array.from({ length: size }, () => Array.from({ length: size - 1 }, sign));

  const pieces: Piece[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      pieces.push({
        id: row * size + col,
        row,
        col,
        edges: {
          top: row === 0 ? 0 : ((-horizontal[row - 1][col]) as Tab),
          bottom: row === size - 1 ? 0 : horizontal[row][col],
          left: col === 0 ? 0 : ((-vertical[row][col - 1]) as Tab),
          right: col === size - 1 ? 0 : vertical[row][col],
        },
      });
    }
  }

  return {
    size,
    pieces,
    placed: pieces.map(() => false),
    tray: shuffle(pieces.map((piece) => piece.id), rng),
  };
}

export function place(state: PuzzleState, pieceId: number, row: number, col: number): { state: PuzzleState; result: PlaceResult } {
  const piece = state.pieces[pieceId];
  if (!piece || state.placed[pieceId]) return { state, result: 'ignored' };
  if (piece.row !== row || piece.col !== col) return { state, result: 'wrong' };
  const placed = state.placed.slice();
  placed[pieceId] = true;
  return {
    state: { ...state, placed, tray: state.tray.filter((id) => id !== pieceId) },
    result: 'placed',
  };
}

export function placedCount(state: PuzzleState): number {
  return state.placed.filter(Boolean).length;
}

export function isComplete(state: PuzzleState): boolean {
  return state.placed.every(Boolean);
}

export function cellSize(state: Pick<PuzzleState, 'size'>): number {
  return PUZZLE_SIZE / state.size;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Un lado de la pieza, de p0 a p1, con su lengüeta. outward es la normal que
 * apunta hacia afuera de la pieza.
 */
function edgePath(p0: [number, number], p1: [number, number], outward: [number, number], tab: Tab, side: number): string {
  const end = `L ${round(p1[0])} ${round(p1[1])}`;
  if (tab === 0) return end;
  const dir: [number, number] = [(p1[0] - p0[0]) / side, (p1[1] - p0[1]) / side];
  const h = TAB_DEPTH * tab;
  const at = (u: number, v: number) =>
    `${round(p0[0] + dir[0] * u * side + outward[0] * v * side)} ${round(p0[1] + dir[1] * u * side + outward[1] * v * side)}`;
  return [
    `L ${at(0.38, 0)}`,
    `C ${at(0.4, h * 0.4)} ${at(0.3, h)} ${at(0.5, h)}`,
    `C ${at(0.7, h)} ${at(0.6, h * 0.4)} ${at(0.62, 0)}`,
    end,
  ].join(' ');
}

/** Contorno de la pieza en coordenadas del tablero. */
export function piecePath(piece: Piece, size: number): string {
  const side = PUZZLE_SIZE / size;
  const x = piece.col * side;
  const y = piece.row * side;
  const tl: [number, number] = [x, y];
  const tr: [number, number] = [x + side, y];
  const br: [number, number] = [x + side, y + side];
  const bl: [number, number] = [x, y + side];
  return [
    `M ${round(tl[0])} ${round(tl[1])}`,
    edgePath(tl, tr, [0, -1], piece.edges.top, side),
    edgePath(tr, br, [1, 0], piece.edges.right, side),
    edgePath(br, bl, [0, 1], piece.edges.bottom, side),
    edgePath(bl, tl, [-1, 0], piece.edges.left, side),
    'Z',
  ].join(' ');
}

/** Recuadro (en coordenadas del tablero) que contiene a la pieza con sus lengüetas. */
export function pieceViewBox(piece: Piece, size: number): { x: number; y: number; w: number } {
  const side = PUZZLE_SIZE / size;
  return {
    x: piece.col * side - side * PIECE_MARGIN,
    y: piece.row * side - side * PIECE_MARGIN,
    w: side * (1 + PIECE_MARGIN * 2),
  };
}
