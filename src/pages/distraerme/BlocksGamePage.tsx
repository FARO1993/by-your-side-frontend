import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ChevronDown, ChevronLeft, ChevronRight, Pause, Play, RotateCw } from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { Button, Card } from '../../components/byourside/ui';
import { cn } from '../../lib/cn';
import {
  COLS,
  ROWS,
  createBlocksGame,
  drop,
  landingY,
  move,
  rotate,
  shapeOf,
  step,
  toneOf,
  type BlocksState,
  type Tone,
} from '../../lib/games/blocks';
import { BLOCKS_GRAVITY_MS } from '../../lib/games/blocksTiming';

type Action = 'tick' | 'left' | 'right' | 'rotate' | 'down' | 'drop' | 'restart';

function reducer(state: BlocksState, action: Action): BlocksState {
  switch (action) {
    case 'tick':
    case 'down':
      return step(state).state;
    case 'left':
      return move(state, -1);
    case 'right':
      return move(state, 1);
    case 'rotate':
      return rotate(state);
    case 'drop':
      return drop(state).state;
    case 'restart':
      return createBlocksGame();
  }
}

type Status = 'ready' | 'playing' | 'paused';

const toneClass: Record<Tone, string> = {
  presence: 'bg-presence',
  listening: 'bg-listening',
};

const KEYS: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'rotate',
  ArrowDown: 'down',
  ' ': 'drop',
};

export default function BlocksGamePage() {
  const navigate = useNavigate();
  const [game, dispatch] = useReducer(reducer, undefined, () => createBlocksGame());
  const [status, setStatus] = useState<Status>('ready');
  const playing = status === 'playing' && !game.over;

  // Gravedad constante: nunca acelera.
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => dispatch('tick'), BLOCKS_GRAVITY_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  const act = useCallback(
    (action: Action) => {
      if (playing) dispatch(action);
    },
    [playing],
  );

  // Teclado: flechas, espacio para soltar, P o Escape para pausar.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if ((event.key === 'p' || event.key === 'P' || event.key === 'Escape') && !game.over && status !== 'ready') {
        event.preventDefault();
        setStatus((current) => (current === 'playing' ? 'paused' : 'playing'));
        return;
      }
      const action = KEYS[event.key];
      if (action && playing) {
        event.preventDefault();
        dispatch(action);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, status, game.over]);

  // Si cambiás de pestaña o bloqueás el celular, se pausa solo.
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) setStatus((current) => (current === 'playing' ? 'paused' : current));
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  function restart() {
    dispatch('restart');
    setStatus('playing');
  }

  const cells = useMemo(() => {
    const view: { tone: Tone | null; ghost: boolean }[][] = game.board.map((row) =>
      row.map((tone) => ({ tone, ghost: false })),
    );
    if (!game.over) {
      const ghostY = landingY(game);
      const tone = toneOf(game.active.kind);
      game.active.cells.forEach(([cx, cy]) => {
        const gx = game.active.x + cx;
        const gy = ghostY + cy;
        if (view[gy]?.[gx] && view[gy][gx].tone === null) view[gy][gx] = { tone: null, ghost: true };
      });
      game.active.cells.forEach(([cx, cy]) => {
        const ax = game.active.x + cx;
        const ay = game.active.y + cy;
        if (view[ay]?.[ax]) view[ay][ax] = { tone, ghost: false };
      });
    }
    return view;
  }, [game]);

  const lines = game.linesCleared;

  return (
    <GameShell
      title="Bloques"
      subtitle="Encajá las piezas a tu ritmo. No acelera, y podés pausar cuando quieras."
      actions={
        status !== 'ready' && !game.over ? (
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
        {game.over ? `Se llenó el tablero. Completaste ${lines} ${lines === 1 ? 'fila' : 'filas'}.` : lines > 0 ? `${lines} ${lines === 1 ? 'fila completa' : 'filas completas'}` : ''}
      </p>
      <p className="sr-only">
        Juego visual. Se controla con las flechas: izquierda y derecha mueven, arriba gira, abajo baja, espacio suelta la
        pieza y P pausa.
      </p>

      <div className="mx-auto flex max-w-md items-start justify-center gap-4">
        <div className="relative w-full max-w-[15.5rem] sm:max-w-[17rem]">
          <div
            aria-hidden="true"
            className="grid gap-[3px] rounded-2xl bg-muted/70 p-[5px] shadow-soft"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
          >
            {cells.flatMap((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    'aspect-square rounded-[35%]',
                    cell.tone ? toneClass[cell.tone] : 'bg-card/60',
                    cell.ghost && 'border-2 border-dashed border-foreground/25 bg-transparent',
                  )}
                />
              )),
            )}
          </div>

          {status !== 'playing' && !game.over ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-overlay/40 p-4 text-center backdrop-blur-[2px]">
              <p className="font-serif text-lg text-foreground">{status === 'ready' ? 'Cuando quieras' : 'En pausa'}</p>
              <Button type="button" variant="listening" onClick={() => setStatus('playing')}>
                <Play className="size-4" aria-hidden="true" />
                {status === 'ready' ? 'Empezar' : 'Seguir'}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="hidden w-24 shrink-0 space-y-2 sm:block" aria-hidden="true">
          <p className="text-xs text-muted-foreground">Sigue</p>
          <NextPreview kind={game.next} />
        </div>
      </div>

      {game.over ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Se llenó el tablero</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lines > 0 ? `Completaste ${lines} ${lines === 1 ? 'fila' : 'filas'}. ` : ''}Fue un rato para vos, y eso es lo que cuenta.
          </p>
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
        <div role="group" aria-label="Controles" className="mx-auto grid max-w-sm grid-cols-5 gap-2">
          <ControlButton label="Mover a la izquierda" onPress={() => act('left')} disabled={!playing}>
            <ChevronLeft className="size-6" />
          </ControlButton>
          <ControlButton label="Girar" onPress={() => act('rotate')} disabled={!playing}>
            <RotateCw className="size-5" />
          </ControlButton>
          <ControlButton label="Mover a la derecha" onPress={() => act('right')} disabled={!playing}>
            <ChevronRight className="size-6" />
          </ControlButton>
          <ControlButton label="Bajar" onPress={() => act('down')} disabled={!playing}>
            <ChevronDown className="size-6" />
          </ControlButton>
          <ControlButton label="Soltar" onPress={() => act('drop')} disabled={!playing}>
            <ArrowDownToLine className="size-5" />
          </ControlButton>
        </div>
      )}
    </GameShell>
  );
}

function ControlButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      className="flex min-h-12 items-center justify-center rounded-2xl bg-card text-foreground/80 shadow-soft active:scale-95 disabled:opacity-40 motion-reduce:active:scale-100"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

function NextPreview({ kind }: { kind: BlocksState['next'] }) {
  const shape = shapeOf(kind);
  const tone = toneOf(kind);
  const filled = new Set(shape.map(([x, y]) => `${x},${y}`));
  return (
    <div className="grid grid-cols-4 gap-[3px] rounded-xl bg-muted/70 p-[5px]">
      {Array.from({ length: 16 }, (_, i) => {
        const x = i % 4;
        const y = Math.floor(i / 4);
        return (
          <div
            key={i}
            className={cn('aspect-square rounded-[35%]', filled.has(`${x},${y}`) ? toneClass[tone] : 'bg-card/60')}
          />
        );
      })}
    </div>
  );
}
