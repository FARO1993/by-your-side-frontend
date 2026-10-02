import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { Button, Card } from '../../components/byourside/ui';
import {
  BALL_R,
  BRICK_COLS,
  BRICK_ROWS,
  FIELD_H,
  FIELD_W,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
  advance,
  createReboundGame,
  type ReboundState,
} from '../../lib/games/rebound';

type Status = 'ready' | 'playing' | 'paused';

/** Un frame muy largo (pestaña en segundo plano, lag) no hace saltar la pelota. */
const MAX_FRAME_MS = 50;
const TOTAL_BRICKS = BRICK_ROWS * BRICK_COLS;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type Palette = { presence: string; listening: string; paddle: string; ball: string };

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    presence: token('--presence', '#e8826b'),
    listening: token('--listening', '#5aa5a8'),
    paddle: token('--listening-strong', '#3f7f82'),
    ball: token('--foreground', '#3a3a4a'),
  };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

function draw(canvas: HTMLCanvasElement | null, game: ReboundState, palette: Palette) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Ajusta la resolución al tamaño real (y a pantallas de alta densidad).
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  if (width === 0 || height === 0) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const scale = width / FIELD_W;
  ctx.setTransform(scale, 0, 0, height / FIELD_H, 0, 0);
  ctx.clearRect(0, 0, FIELD_W, FIELD_H);

  game.bricks.forEach((brick) => {
    ctx.fillStyle = brick.tone === 'presence' ? palette.presence : palette.listening;
    roundedRect(ctx, brick.x, brick.y, brick.w, brick.h, 1.6);
  });

  ctx.fillStyle = palette.paddle;
  roundedRect(ctx, game.paddleX - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H, PADDLE_H / 2);

  ctx.fillStyle = palette.ball;
  ctx.beginPath();
  ctx.arc(game.ball.x, game.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
}

export default function ReboundGamePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('ready');
  const [left, setLeft] = useState(TOTAL_BRICKS);
  const [cleared, setCleared] = useState(false);

  const gameRef = useRef<ReboundState>(createReboundGame({ reducedMotion: prefersReducedMotion() }));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<Palette | null>(null);
  const targetRef = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false });

  const playing = status === 'playing' && !cleared;
  const total = TOTAL_BRICKS;

  const palette = useCallback(() => {
    if (!paletteRef.current) paletteRef.current = readPalette();
    return paletteRef.current;
  }, []);

  const redraw = useCallback(() => draw(canvasRef.current, gameRef.current, palette()), [palette]);

  // Dibujo inicial, al cambiar de tamaño y al cambiar de tema.
  useEffect(() => {
    redraw();
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    const observer =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            paletteRef.current = null;
            redraw();
          });
    observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [redraw]);

  // Bucle de juego: solo corre mientras se juega.
  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let last: number | null = null;

    function tick(now: number) {
      const dt = last === null ? 0 : Math.min(MAX_FRAME_MS, now - last);
      last = now;
      const keys = keysRef.current;
      const dir = keys.left === keys.right ? 0 : keys.left ? -1 : 1;
      const next = advance(gameRef.current, dt, { dir, target: dir === 0 ? targetRef.current : null });
      gameRef.current = next;
      draw(canvasRef.current, next, palette());
      setLeft(next.bricks.length);
      if (next.cleared) {
        setCleared(true);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, palette]);

  // Teclado: flechas mueven la paleta, P o Escape pausan.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if ((event.key === 'p' || event.key === 'P' || event.key === 'Escape') && !cleared && status !== 'ready') {
        event.preventDefault();
        setStatus((current) => (current === 'playing' ? 'paused' : 'playing'));
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (!playing) return;
        event.preventDefault();
        targetRef.current = null;
        keysRef.current[event.key === 'ArrowLeft' ? 'left' : 'right'] = true;
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') keysRef.current.left = false;
      if (event.key === 'ArrowRight') keysRef.current.right = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [playing, status, cleared]);

  // Si cambiás de pestaña o bloqueás el celular, se pausa solo.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) setStatus((current) => (current === 'playing' ? 'paused' : current));
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  function aim(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    targetRef.current = ((event.clientX - rect.left) / rect.width) * FIELD_W;
  }

  function restart() {
    gameRef.current = createReboundGame({ reducedMotion: prefersReducedMotion() });
    targetRef.current = null;
    setLeft(TOTAL_BRICKS);
    setCleared(false);
    setStatus('playing');
    redraw();
  }

  return (
    <GameShell
      title="Rebote"
      subtitle="Una pelota, una paleta y nada que perder. Si se escapa, vuelve sola."
      actions={
        status !== 'ready' && !cleared ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setStatus((current) => (current === 'playing' ? 'paused' : 'playing'))}
          >
            {status === 'playing' ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            {status === 'playing' ? 'Pausa' : 'Seguir'}
          </Button>
        ) : null
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {cleared ? 'Despejaste toda la pared.' : status === 'paused' ? 'En pausa.' : ''}
      </p>
      <p className="sr-only">
        Juego visual. Mové la paleta arrastrando sobre el tablero o con las flechas izquierda y derecha. P pausa.
      </p>

      <p className="text-center text-sm text-muted-foreground" aria-hidden="true">
        {total - left} de {total} ladrillos
      </p>

      <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-[19rem]">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          data-testid="rebound-field"
          onPointerDown={aim}
          onPointerMove={aim}
          className="block aspect-[100/140] w-full touch-none rounded-2xl bg-muted/70 shadow-soft"
        />

        {status !== 'playing' && !cleared ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-overlay/40 p-4 text-center backdrop-blur-[2px]">
            <p className="font-serif text-lg text-foreground">{status === 'ready' ? 'Cuando quieras' : 'En pausa'}</p>
            <Button type="button" variant="listening" onClick={() => setStatus('playing')}>
              <Play className="size-4" aria-hidden="true" />
              {status === 'ready' ? 'Empezar' : 'Seguir'}
            </Button>
          </div>
        ) : null}
      </div>

      {cleared ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Despejaste la pared</p>
          <p className="mt-1 text-sm text-muted-foreground">Sin apuro y sin vidas que cuidar. Fue un rato para vos.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={restart}>
              Otra
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/distraerme?jugar=solo')}>
              Elegir otro juego
            </Button>
          </div>
        </Card>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Arrastrá el dedo o el mouse sobre el tablero, o usá las flechas.
        </p>
      )}
    </GameShell>
  );
}
