import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Blocks, CircleDot, Gamepad2, Heart, LayoutGrid, Sprout, UserRound, Users, type LucideIcon } from 'lucide-react';
import { Card } from '../../components/byourside/ui';
import { cn } from '../../lib/cn';

type GameEntry = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string | null;
};

const GAMES: GameEntry[] = [
  {
    id: 'jardin',
    title: 'Jardín',
    description: 'Plantar, regar y ver florecer. Nada se marchita.',
    icon: Sprout,
    path: '/distraerme/jardin',
  },
  {
    id: 'memoria',
    title: 'Memoria',
    description: 'Cartas por parejas, sin reloj.',
    icon: LayoutGrid,
    path: '/distraerme/memoria',
  },
  {
    id: 'bloques',
    title: 'Bloques',
    description: 'Encajar piezas, a tu ritmo.',
    icon: Blocks,
    path: '/distraerme/bloques',
  },
  {
    id: 'rebote',
    title: 'Rebote',
    description: 'Una pelota, una paleta y nada que perder.',
    icon: CircleDot,
    path: '/distraerme/rebote',
  },
];

/**
 * Distraerme: no arranca preguntando "¿a qué querés jugar?". Primero el
 * cómo (solo/a o con alguien), después el qué. Sin rankings ni rachas.
 */
export default function DistraermePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const choosing = searchParams.get('jugar') === 'solo';

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-listening-soft via-card to-presence-soft p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card text-listening-strong">
          <Gamepad2 className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl">Distraerme</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Está bien desconectar un rato. No importa ganar: la idea es pasar un buen momento.
        </p>
      </Card>

      {choosing ? (
        <section aria-labelledby="games-title" className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Volver"
              onClick={() => setSearchParams({})}
              className="inline-flex size-9 items-center justify-center rounded-full bg-card shadow-soft"
            >
              <ArrowLeft className="size-4" />
            </button>
            <h2 id="games-title" className="font-serif text-xl">
              ¿Qué te dan ganas?
            </h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {GAMES.map((game) => {
              const Icon = game.icon;
              const available = game.path !== null;
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => game.path && navigate(game.path)}
                    className={cn(
                      'flex h-full w-full flex-col items-start gap-2 rounded-2xl bg-card p-4 text-left shadow-soft transition-shadow',
                      available ? 'hover:shadow-lift' : 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-listening-soft text-listening-strong">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-medium text-foreground">{game.title}</span>
                    <span className="text-sm text-muted-foreground">{game.description}</span>
                    {!available ? <span className="text-xs font-medium text-muted-foreground">Muy pronto</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section aria-label="Cómo querés jugar" className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSearchParams({ jugar: 'solo' })}
            className="flex flex-col items-start gap-2 rounded-2xl bg-card p-5 text-left shadow-soft transition-shadow hover:shadow-lift"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-listening-soft text-listening-strong">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <span className="font-serif text-lg text-foreground">Jugar solo/a</span>
            <span className="text-sm text-muted-foreground">Un juego tranquilo, a tu ritmo. Pausás o salís cuando quieras.</span>
          </button>
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-5">
            <span className="flex size-11 items-center justify-center rounded-full bg-presence-soft text-presence-strong">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <span className="font-serif text-lg text-foreground">Invitar a alguien</span>
            <span className="text-sm text-muted-foreground">
              Muy pronto vas a poder compartir una partida con alguien. A veces acompañar es hacer algo juntos.
            </span>
            <button
              type="button"
              onClick={() => navigate('/companion')}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-listening-strong underline-offset-2 hover:underline"
            >
              <Heart className="size-3.5" aria-hidden="true" />
              Mientras tanto, buscar compañía
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
