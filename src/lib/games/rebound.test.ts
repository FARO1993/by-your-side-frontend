import { describe, expect, it } from 'vitest';
import {
  BALL_R,
  BALL_SPEED,
  BALL_SPEED_REDUCED,
  BRICK_COLS,
  BRICK_ROWS,
  FIELD_H,
  FIELD_W,
  PADDLE_W,
  PADDLE_Y,
  SERVE_DELAY_MS,
  advance,
  clampPaddle,
  createReboundGame,
  paddleBounce,
  type ReboundState,
} from './rebound';

function inPlay(state: ReboundState, ball: ReboundState['ball']): ReboundState {
  return { ...state, serveIn: 0, ball };
}

const speedOf = (ball: ReboundState['ball']) => Math.hypot(ball.vx, ball.vy);

describe('rebound', () => {
  it('starts with a full wall and the ball resting on the paddle', () => {
    const game = createReboundGame();
    expect(game.bricks).toHaveLength(BRICK_ROWS * BRICK_COLS);
    expect(game.total).toBe(BRICK_ROWS * BRICK_COLS);
    expect(game.ball.vx).toBe(0);
    expect(game.ball.vy).toBe(0);
    expect(game.ball.x).toBe(game.paddleX);
    expect(game.serveIn).toBe(SERVE_DELAY_MS);
    game.bricks.forEach((brick) => {
      expect(brick.x).toBeGreaterThanOrEqual(0);
      expect(brick.x + brick.w).toBeLessThanOrEqual(FIELD_W + 1e-9);
    });
  });

  it('is slower with reduced motion', () => {
    expect(createReboundGame({ reducedMotion: true }).speed).toBe(BALL_SPEED_REDUCED);
    expect(createReboundGame().speed).toBe(BALL_SPEED);
  });

  it('serves on its own after a short rest, carrying the ball with the paddle', () => {
    let game = createReboundGame();
    game = advance(game, SERVE_DELAY_MS / 2, { target: 20 });
    expect(game.ball.vy).toBe(0);
    expect(game.ball.x).toBe(game.paddleX);
    game = advance(game, SERVE_DELAY_MS);
    expect(game.serveIn).toBe(0);
    expect(game.ball.vy).toBeLessThan(0);
  });

  it('moves the paddle toward a target at a calm max speed and keeps it inside', () => {
    const game = createReboundGame();
    const moved = advance(game, 100, { target: FIELD_W });
    expect(moved.paddleX).toBeGreaterThan(game.paddleX);
    expect(moved.paddleX).toBeLessThan(FIELD_W - PADDLE_W / 2);
    const far = advance(game, 5000, { target: FIELD_W + 50 });
    expect(far.paddleX).toBe(FIELD_W - PADDLE_W / 2);
    const left = advance(game, 5000, { dir: -1 });
    expect(left.paddleX).toBe(PADDLE_W / 2);
    expect(clampPaddle(-10)).toBe(PADDLE_W / 2);
  });

  it('bounces off the side walls and the ceiling without losing speed', () => {
    const base = createReboundGame();
    const wall = advance(inPlay(base, { x: FIELD_W - BALL_R - 0.2, y: 80, vx: 30, vy: -30 }), 16);
    expect(wall.ball.vx).toBeLessThan(0);
    const ceiling = advance(inPlay({ ...base, bricks: [] }, { x: 50, y: BALL_R + 0.2, vx: 0, vy: -40 }), 16);
    expect(ceiling.ball.vy).toBeGreaterThan(0);
    expect(speedOf(ceiling.ball)).toBeCloseTo(40);
  });

  it('bounces off the paddle with an angle that depends on where it hits', () => {
    const center = paddleBounce(50, 50, 50);
    expect(center.vx).toBeCloseTo(0);
    expect(center.vy).toBeCloseTo(-50);
    const edge = paddleBounce(50 + PADDLE_W / 2, 50, 50);
    expect(edge.vx).toBeGreaterThan(0);
    expect(edge.vy).toBeLessThan(0);
    expect(Math.hypot(edge.vx, edge.vy)).toBeCloseTo(50);

    const base = createReboundGame();
    const next = advance(inPlay(base, { x: base.paddleX + 4, y: PADDLE_Y - BALL_R - 0.3, vx: 0, vy: 40 }), 16);
    expect(next.ball.vy).toBeLessThan(0);
    expect(next.ball.vx).toBeGreaterThan(0);
  });

  it('has no lives: a missed ball just comes back to the paddle', () => {
    const base = createReboundGame();
    const missed = advance(inPlay(base, { x: 5, y: FIELD_H - 1, vx: 0, vy: 50 }), 200);
    expect(missed.serveIn).toBeGreaterThan(0);
    expect(missed.ball.x).toBe(missed.paddleX);
    expect(missed.bricks).toHaveLength(base.bricks.length);
    expect(missed.cleared).toBe(false);
  });

  it('removes a brick it touches and bounces back', () => {
    const base = createReboundGame();
    const target = base.bricks[base.bricks.length - 1];
    const below = target.y + target.h + BALL_R + 0.1;
    const next = advance(
      inPlay(base, { x: target.x + target.w / 2, y: below, vx: 0, vy: -40 }),
      16,
    );
    expect(next.bricks).toHaveLength(base.bricks.length - 1);
    expect(next.bricks.some((brick) => brick.id === target.id)).toBe(false);
    expect(next.ball.vy).toBeGreaterThan(0);
  });

  it('is cleared when the last brick goes, and then stops', () => {
    const base = createReboundGame();
    const last = base.bricks[0];
    const state = inPlay(
      { ...base, bricks: [last] },
      { x: last.x + last.w / 2, y: last.y + last.h + BALL_R + 0.1, vx: 0, vy: -40 },
    );
    const done = advance(state, 16);
    expect(done.cleared).toBe(true);
    expect(advance(done, 1000)).toBe(done);
  });

  it('eventually clears the wall when the paddle follows the ball', () => {
    let game = createReboundGame();
    for (let i = 0; i < 40000 && !game.cleared; i += 1) {
      // Como una persona: sigue la pelota y va variando dónde la recibe.
      const aim = Math.sin(i / 700) * (PADDLE_W / 3);
      game = advance(game, 16, { target: game.ball.x - aim });
    }
    expect(game.cleared).toBe(true);
  });
});
