/**
 * Bloques: lógica pura (sin React).
 *
 * Diseño propio, pensado para calmar y no para presionar:
 * - tablero de 8×14 y piezas de 3 y 4 bloques mezcladas;
 * - velocidad constante (la UI no acelera nunca), sin niveles ni puntaje;
 * - sombra de dónde cae la pieza y vista previa de la siguiente.
 */
export const COLS = 8;
export const ROWS = 14;

export type Tone = 'presence' | 'listening';
export type Cell = Tone | null;
export type Board = Cell[][];
export type Point = readonly [x: number, y: number];

export type PieceKind = 'I3' | 'L3' | 'I4' | 'O4' | 'T4' | 'L4' | 'J4' | 'S4' | 'Z4';

const SHAPES: Record<PieceKind, { cells: Point[]; tone: Tone }> = {
  I3: { cells: [[0, 0], [1, 0], [2, 0]], tone: 'listening' },
  L3: { cells: [[0, 0], [0, 1], [1, 1]], tone: 'presence' },
  I4: { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], tone: 'listening' },
  O4: { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], tone: 'presence' },
  T4: { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], tone: 'listening' },
  L4: { cells: [[0, 0], [0, 1], [0, 2], [1, 2]], tone: 'presence' },
  J4: { cells: [[1, 0], [1, 1], [1, 2], [0, 2]], tone: 'listening' },
  S4: { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], tone: 'presence' },
  Z4: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], tone: 'listening' },
};

export const PIECE_KINDS = Object.keys(SHAPES) as PieceKind[];

export type ActivePiece = { kind: PieceKind; cells: Point[]; x: number; y: number };

export type BlocksState = {
  board: Board;
  active: ActivePiece;
  next: PieceKind;
  /** Bolsa de piezas pendientes: cada tanda trae todas una vez (sin rachas de mala suerte). */
  bag: PieceKind[];
  linesCleared: number;
  over: boolean;
};

export type Rng = () => number;

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

export function toneOf(kind: PieceKind): Tone {
  return SHAPES[kind].tone;
}

export function shapeOf(kind: PieceKind): Point[] {
  return SHAPES[kind].cells;
}

function normalize(cells: Point[]): Point[] {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - minX, y - minY] as const);
}

/** Rota 90° en sentido horario y vuelve a apoyar la pieza en el origen. */
export function rotateCells(cells: Point[]): Point[] {
  const maxY = Math.max(...cells.map(([, y]) => y));
  return normalize(cells.map(([x, y]) => [maxY - y, x] as const));
}

function width(cells: Point[]): number {
  return Math.max(...cells.map(([x]) => x)) + 1;
}

function shuffled(rng: Rng): PieceKind[] {
  const bag = [...PIECE_KINDS];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function draw(bag: PieceKind[], rng: Rng): { kind: PieceKind; bag: PieceKind[] } {
  const source = bag.length > 0 ? bag : shuffled(rng);
  return { kind: source[0], bag: source.slice(1) };
}

function spawn(kind: PieceKind): ActivePiece {
  const cells = shapeOf(kind);
  return { kind, cells, x: Math.floor((COLS - width(cells)) / 2), y: 0 };
}

export function fits(board: Board, cells: Point[], x: number, y: number): boolean {
  return cells.every(([cx, cy]) => {
    const bx = x + cx;
    const by = y + cy;
    return bx >= 0 && bx < COLS && by >= 0 && by < ROWS && board[by][bx] === null;
  });
}

export function createBlocksGame(rng: Rng = Math.random): BlocksState {
  const first = draw([], rng);
  const second = draw(first.bag, rng);
  return {
    board: emptyBoard(),
    active: spawn(first.kind),
    next: second.kind,
    bag: second.bag,
    linesCleared: 0,
    over: false,
  };
}

export function move(state: BlocksState, dx: number): BlocksState {
  if (state.over) return state;
  const { active } = state;
  return fits(state.board, active.cells, active.x + dx, active.y)
    ? { ...state, active: { ...active, x: active.x + dx } }
    : state;
}

/** Rota con pequeños corrimientos si choca contra una pared o un bloque. */
export function rotate(state: BlocksState): BlocksState {
  if (state.over) return state;
  const { active } = state;
  const cells = rotateCells(active.cells);
  // Hasta ±3: una pieza de 4 en vertical pegada a la pared necesita correrse 3 para acostarse.
  for (const kick of [0, -1, 1, -2, 2, -3, 3]) {
    if (fits(state.board, cells, active.x + kick, active.y)) {
      return { ...state, active: { ...active, cells, x: active.x + kick } };
    }
  }
  return state;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - remaining.length;
  const fresh = Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null));
  return { board: [...fresh, ...remaining], cleared };
}

function lock(state: BlocksState, rng: Rng): { state: BlocksState; cleared: number } {
  const { active } = state;
  const tone = toneOf(active.kind);
  const placed = state.board.map((row) => [...row]);
  active.cells.forEach(([cx, cy]) => {
    placed[active.y + cy][active.x + cx] = tone;
  });
  const { board, cleared } = clearLines(placed);
  const nextActive = spawn(state.next);
  const upcoming = draw(state.bag, rng);
  const over = !fits(board, nextActive.cells, nextActive.x, nextActive.y);
  return {
    state: {
      board,
      active: nextActive,
      next: upcoming.kind,
      bag: upcoming.bag,
      linesCleared: state.linesCleared + cleared,
      over,
    },
    cleared,
  };
}

/** Un paso de gravedad: baja la pieza o, si no puede, la fija y saca la siguiente. */
export function step(state: BlocksState, rng: Rng = Math.random): { state: BlocksState; cleared: number; locked: boolean } {
  if (state.over) return { state, cleared: 0, locked: false };
  const { active } = state;
  if (fits(state.board, active.cells, active.x, active.y + 1)) {
    return { state: { ...state, active: { ...active, y: active.y + 1 } }, cleared: 0, locked: false };
  }
  const result = lock(state, rng);
  return { ...result, locked: true };
}

/** Fila donde quedaría la pieza si cayera ahora (para la sombra). */
export function landingY(state: BlocksState): number {
  const { active } = state;
  let y = active.y;
  while (fits(state.board, active.cells, active.x, y + 1)) y += 1;
  return y;
}

/** Baja la pieza hasta el fondo y la fija. */
export function drop(state: BlocksState, rng: Rng = Math.random): { state: BlocksState; cleared: number } {
  if (state.over) return { state, cleared: 0 };
  const landed = { ...state, active: { ...state.active, y: landingY(state) } };
  return lock(landed, rng);
}
