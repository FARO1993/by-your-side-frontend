/**
 * Rebote: una pelota, una paleta y una pared de ladrillos. Lógica pura y
 * determinística (sin DOM ni timers) para poder testearla.
 *
 * Modo tranquilo: no hay vidas. Si la pelota se escapa por abajo vuelve a
 * apoyarse en la paleta y sale sola un momento después. La velocidad es
 * constante: nunca acelera.
 *
 * Coordenadas en unidades abstractas: el campo mide FIELD_W × FIELD_H y la
 * vista lo escala al tamaño real.
 */
export const FIELD_W = 100;
export const FIELD_H = 140;

export const PADDLE_W = 22;
export const PADDLE_H = 3;
export const PADDLE_Y = 128;
/** Velocidad máxima de la paleta (unidades/segundo). */
export const PADDLE_SPEED = 120;

export const BALL_R = 2.2;
export const BALL_SPEED = 52;
/** Más lenta si el sistema pide movimiento reducido. */
export const BALL_SPEED_REDUCED = 40;

/** Tiempo que la pelota descansa sobre la paleta antes de salir. */
export const SERVE_DELAY_MS = 1100;

export const BRICK_ROWS = 5;
export const BRICK_COLS = 7;
const BRICK_TOP = 16;
const BRICK_H = 5;
const BRICK_GAP = 1.6;
const BRICK_SIDE = 4;
/** Ángulo máximo respecto de la vertical al rebotar en la paleta. */
const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;
/** Paso máximo de simulación, para que la pelota no atraviese nada. */
const MAX_SUBSTEP_MS = 8;

export type Tone = 'presence' | 'listening';

export type Brick = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: Tone;
};

export type ReboundState = {
  bricks: Brick[];
  total: number;
  paddleX: number;
  ball: { x: number; y: number; vx: number; vy: number };
  speed: number;
  /** ms que faltan para que la pelota salga de la paleta (0 = en juego). */
  serveIn: number;
  cleared: boolean;
};

export type ReboundInput = {
  /** Teclado: -1 izquierda, 1 derecha, 0 quieta. */
  dir?: -1 | 0 | 1;
  /** Mouse/dedo: posición x (en unidades del campo) a la que va la paleta. */
  target?: number | null;
};

export function createBricks(): Brick[] {
  const width = (FIELD_W - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      bricks.push({
        id: row * BRICK_COLS + col,
        x: BRICK_SIDE + col * (width + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_H + BRICK_GAP),
        w: width,
        h: BRICK_H,
        tone: row % 2 === 0 ? 'presence' : 'listening',
      });
    }
  }
  return bricks;
}

function restingBall(paddleX: number) {
  return { x: paddleX, y: PADDLE_Y - BALL_R - 0.01, vx: 0, vy: 0 };
}

export function createReboundGame(options: { reducedMotion?: boolean } = {}): ReboundState {
  const bricks = createBricks();
  const paddleX = FIELD_W / 2;
  return {
    bricks,
    total: bricks.length,
    paddleX,
    ball: restingBall(paddleX),
    speed: options.reducedMotion ? BALL_SPEED_REDUCED : BALL_SPEED,
    serveIn: SERVE_DELAY_MS,
    cleared: false,
  };
}

export function clampPaddle(x: number): number {
  return Math.min(FIELD_W - PADDLE_W / 2, Math.max(PADDLE_W / 2, x));
}

/** Velocidad de salida al apoyarse en la paleta: hacia arriba con un leve ángulo. */
function launchVelocity(speed: number) {
  const angle = (12 * Math.PI) / 180;
  return { vx: speed * Math.sin(angle), vy: -speed * Math.cos(angle) };
}

/**
 * Dirección de rebote según dónde pega en la paleta: al centro sale casi
 * vertical, en los bordes con más ángulo. Así se puede "apuntar" sin presión.
 */
export function paddleBounce(ballX: number, paddleX: number, speed: number) {
  const offset = Math.max(-1, Math.min(1, (ballX - paddleX) / (PADDLE_W / 2)));
  const angle = offset * MAX_BOUNCE_ANGLE;
  return { vx: speed * Math.sin(angle), vy: -speed * Math.cos(angle) };
}

function movePaddle(paddleX: number, input: ReboundInput, dtMs: number): number {
  const maxDelta = (PADDLE_SPEED * dtMs) / 1000;
  if (input.target !== undefined && input.target !== null) {
    const delta = clampPaddle(input.target) - paddleX;
    return clampPaddle(paddleX + Math.max(-maxDelta, Math.min(maxDelta, delta)));
  }
  if (input.dir) return clampPaddle(paddleX + input.dir * maxDelta);
  return paddleX;
}

function hitsBrick(x: number, y: number, brick: Brick): boolean {
  const nearestX = Math.max(brick.x, Math.min(x, brick.x + brick.w));
  const nearestY = Math.max(brick.y, Math.min(y, brick.y + brick.h));
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy <= BALL_R * BALL_R;
}

function substep(state: ReboundState, input: ReboundInput, dtMs: number): ReboundState {
  const paddleX = movePaddle(state.paddleX, input, dtMs);

  if (state.serveIn > 0) {
    const serveIn = Math.max(0, state.serveIn - dtMs);
    const ball = serveIn > 0 ? restingBall(paddleX) : { ...restingBall(paddleX), ...launchVelocity(state.speed) };
    return { ...state, paddleX, ball, serveIn };
  }

  const dt = dtMs / 1000;
  let { x, y, vx, vy } = state.ball;
  const prevY = y;
  x += vx * dt;
  y += vy * dt;

  // Paredes laterales y techo.
  if (x - BALL_R < 0) {
    x = BALL_R;
    vx = Math.abs(vx);
  } else if (x + BALL_R > FIELD_W) {
    x = FIELD_W - BALL_R;
    vx = -Math.abs(vx);
  }
  if (y - BALL_R < 0) {
    y = BALL_R;
    vy = Math.abs(vy);
  }

  // Paleta: solo cuando baja y cruza su borde superior.
  const paddleTop = PADDLE_Y;
  if (vy > 0 && prevY + BALL_R <= paddleTop + 0.5 && y + BALL_R >= paddleTop) {
    const half = PADDLE_W / 2 + BALL_R;
    if (x >= paddleX - half && x <= paddleX + half) {
      y = paddleTop - BALL_R;
      ({ vx, vy } = paddleBounce(x, paddleX, state.speed));
    }
  }

  // Se escapó por abajo: sin castigo, vuelve a la paleta.
  if (y - BALL_R > FIELD_H) {
    return { ...state, paddleX, ball: restingBall(paddleX), serveIn: SERVE_DELAY_MS };
  }

  // Ladrillos: uno por paso, rebotando por el eje de menor penetración.
  let bricks = state.bricks;
  const hit = bricks.find((brick) => hitsBrick(x, y, brick));
  if (hit) {
    bricks = bricks.filter((brick) => brick.id !== hit.id);
    const overlapX = Math.min(x + BALL_R - hit.x, hit.x + hit.w - (x - BALL_R));
    const overlapY = Math.min(y + BALL_R - hit.y, hit.y + hit.h - (y - BALL_R));
    if (overlapX < overlapY) {
      vx = x < hit.x + hit.w / 2 ? -Math.abs(vx) : Math.abs(vx);
    } else {
      vy = y < hit.y + hit.h / 2 ? -Math.abs(vy) : Math.abs(vy);
    }
  }

  return {
    ...state,
    paddleX,
    bricks,
    ball: { x, y, vx, vy },
    cleared: bricks.length === 0,
  };
}

/** Avanza la simulación dtMs milisegundos (en pasos chicos). */
export function advance(state: ReboundState, dtMs: number, input: ReboundInput = {}): ReboundState {
  if (state.cleared || dtMs <= 0) return state;
  let next = state;
  let remaining = dtMs;
  while (remaining > 0 && !next.cleared) {
    const slice = Math.min(MAX_SUBSTEP_MS, remaining);
    next = substep(next, input, slice);
    remaining -= slice;
  }
  return next;
}
