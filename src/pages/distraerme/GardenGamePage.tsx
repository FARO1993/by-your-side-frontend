import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { PlantArt } from '../../components/games/garden/PlantArt';
import { Button, Card } from '../../components/byourside/ui';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import {
  GARDEN_COLS,
  SPECIES,
  createGarden,
  dayPart,
  growIfFull,
  isBloomed,
  plantSeed,
  visitorCount,
  water,
  type DayPart,
  type GardenState,
  type Species,
} from '../../lib/games/garden';
import { SPECIES_META, STAGE_LABEL } from '../../lib/games/gardenSpecies';
import { loadGarden, saveGarden } from '../../lib/games/gardenStorage';

const SKY: Record<DayPart, string> = {
  morning: 'from-presence-soft to-listening-soft',
  afternoon: 'from-listening-soft to-card',
  evening: 'from-presence-soft via-[oklch(0.86_0.05_330)] to-listening-soft',
  night: 'from-[oklch(0.3_0.05_275)] to-[oklch(0.4_0.05_262)]',
};

const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: 'Es de mañana en el jardín.',
  afternoon: 'Es de tarde en el jardín.',
  evening: 'Está atardeciendo en el jardín.',
  night: 'Es de noche en el jardín. Hay luciérnagas.',
};

/** Lugares donde se posan los visitantes (en % del jardín). */
const VISITOR_SPOTS = [
  { left: '12%', top: '18%', delay: '0s' },
  { left: '62%', top: '8%', delay: '-3s' },
  { left: '38%', top: '52%', delay: '-6s' },
  { left: '78%', top: '60%', delay: '-1.5s' },
];

function article(species: Species): string {
  return species === 'tulipan' || species === 'girasol' ? 'un' : 'una';
}

export default function GardenGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [garden, setGarden] = useState<GardenState>(() => loadGarden(userId) ?? createGarden());
  const [seed, setSeed] = useState<Species>('margarita');
  const [announcement, setAnnouncement] = useState('');
  const [splash, setSplash] = useState<{ index: number; key: number } | null>(null);
  const [session, setSession] = useState({ planted: 0, bloomed: 0 });
  const [finished, setFinished] = useState(false);
  const splashTimer = useRef<number | undefined>(undefined);
  const part = useMemo(() => dayPart(new Date().getHours()), []);

  useEffect(() => {
    saveGarden(userId, garden);
  }, [userId, garden]);

  useEffect(() => () => window.clearTimeout(splashTimer.current), []);

  function tend(index: number) {
    const current = garden.plots[index];
    const result = current ? water(garden, index) : plantSeed(garden, index, seed);
    if (result.event === 'ignored') return;

    const grown = growIfFull(result.garden);
    setGarden(grown.garden);

    const plant = grown.garden.plots[index];
    const label = plant ? SPECIES_META[plant.species].label.toLowerCase() : '';
    const messages: string[] = [];
    if (result.event === 'planted') {
      messages.push(`Plantaste ${article(seed)} ${label}.`);
      setSession((s) => ({ ...s, planted: s.planted + 1 }));
    }
    if (result.event === 'watered') messages.push(`Regaste. Ahora es ${STAGE_LABEL[plant?.stage ?? 0]}.`);
    if (result.event === 'bloomed') {
      messages.push(`¡Floreció ${article(plant?.species ?? 'margarita')} ${label}!`);
      setSession((s) => ({ ...s, bloomed: s.bloomed + 1 }));
    }
    if (result.event === 'already-bloomed' && plant) {
      messages.push(`${article(plant.species) === 'un' ? 'Este' : 'Esta'} ${label} ya está en flor.`);
    }
    if (grown.grew) messages.push('El jardín creció: hay canteros nuevos.');
    setAnnouncement(messages.join(' '));

    if (result.event === 'watered' || result.event === 'bloomed') {
      window.clearTimeout(splashTimer.current);
      setSplash((prev) => ({ index, key: (prev?.key ?? 0) + 1 }));
      splashTimer.current = window.setTimeout(() => setSplash(null), 700);
    }
  }

  const visitors = visitorCount(garden);
  const night = part === 'night';

  function closingLine() {
    if (session.bloomed > 0) return `Hoy ${session.bloomed === 1 ? 'floreció una planta' : `florecieron ${session.bloomed} plantas`}.`;
    if (session.planted > 0) return `Hoy ${session.planted === 1 ? 'plantaste una semilla' : `plantaste ${session.planted} semillas`}.`;
    return 'A veces alcanza con pasar a mirar.';
  }

  return (
    <GameShell
      title="Jardín"
      subtitle="Plantá, regá y mirá cómo crece. Acá nada se marchita: tu jardín te espera como lo dejaste."
      actions={
        finished ? null : (
          <Button type="button" size="sm" variant="outline" onClick={() => setFinished(true)}>
            Terminar por hoy
          </Button>
        )
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mx-auto max-w-md overflow-hidden rounded-3xl shadow-soft">
        <div className={cn('relative h-16 bg-gradient-to-b', SKY[part])}>
          <p className="sr-only">{DAY_PART_LABEL[part]}</p>
          <span
            aria-hidden="true"
            className={cn(
              'absolute size-9 rounded-full',
              part === 'morning' && 'top-3 left-6 bg-[oklch(0.9_0.12_90)]',
              part === 'afternoon' && 'top-2 right-8 bg-[oklch(0.9_0.13_88)]',
              part === 'evening' && 'top-7 right-10 bg-[oklch(0.78_0.13_45)]',
              night && 'top-3 right-8 bg-[oklch(0.95_0.02_90)] shadow-[0_0_18px_oklch(0.95_0.03_90/0.6)]',
            )}
          />
          {night
            ? [
                ['14%', '30%'],
                ['30%', '15%'],
                ['48%', '40%'],
                ['66%', '20%'],
              ].map(([left, top]) => (
                <span key={left} aria-hidden="true" className="absolute size-1 rounded-full bg-[oklch(0.95_0.02_90)]" style={{ left, top }} />
              ))
            : null}
        </div>

        <div className="relative bg-soil-deep p-3">
          <div
            role="group"
            aria-label="Canteros del jardín"
            className="grid gap-2.5"
            style={{ gridTemplateColumns: `repeat(${GARDEN_COLS}, minmax(0, 1fr))` }}
          >
            {garden.plots.map((plant, index) => {
              const label = plant
                ? `Cantero ${index + 1}: ${SPECIES_META[plant.species].label}, ${STAGE_LABEL[plant.stage]}${isBloomed(plant) ? '' : '. Regar'}`
                : `Cantero ${index + 1}, vacío. Plantar ${SPECIES_META[seed].label.toLowerCase()}`;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => tend(index)}
                  disabled={finished}
                  aria-label={label}
                  className={cn(
                    'relative flex aspect-[4/5] items-end justify-center rounded-2xl bg-soil p-1 transition-colors',
                    !finished && 'hover:bg-soil/80',
                    !plant && 'border-2 border-dashed border-soil-deep/70',
                  )}
                >
                  {plant ? (
                    <span key={`${plant.species}-${plant.stage}`} className="block h-full w-full origin-bottom animate-grow-in">
                      <PlantArt plant={plant} />
                    </span>
                  ) : null}
                  {splash?.index === index ? (
                    <Droplets
                      key={splash.key}
                      aria-hidden="true"
                      className="absolute top-1 right-1 size-4 animate-soft-rise text-listening-strong"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {Array.from({ length: visitors }, (_, i) => VISITOR_SPOTS[i]).map((spot, i) => (
            <span
              key={i}
              aria-hidden="true"
              data-testid="garden-visitor"
              className="pointer-events-none absolute animate-drift"
              style={{ left: spot.left, top: spot.top, animationDelay: spot.delay }}
            >
              {night ? (
                <span className="block size-2 rounded-full bg-[oklch(0.92_0.14_105)] shadow-[0_0_10px_3px_oklch(0.9_0.15_105/0.55)]" />
              ) : (
                <svg viewBox="0 0 20 16" className="h-4 w-5">
                  <ellipse cx="6" cy="6" rx="5" ry="4.5" fill={i % 2 ? 'var(--listening)' : 'var(--presence)'} />
                  <ellipse cx="14" cy="6" rx="5" ry="4.5" fill={i % 2 ? 'var(--listening)' : 'var(--presence)'} />
                  <ellipse cx="7" cy="11.5" rx="3" ry="2.6" fill={i % 2 ? 'var(--listening)' : 'var(--presence)'} opacity="0.8" />
                  <ellipse cx="13" cy="11.5" rx="3" ry="2.6" fill={i % 2 ? 'var(--listening)' : 'var(--presence)'} opacity="0.8" />
                  <rect x="9.3" y="3" width="1.4" height="11" rx="0.7" fill="var(--foreground)" opacity="0.7" />
                </svg>
              )}
            </span>
          ))}
        </div>
      </div>

      {finished ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Gracias por compartir este ratito 🌱</p>
          <p className="mt-1 text-sm text-muted-foreground">{closingLine()} Tu jardín queda acá, tal cual, para cuando quieras volver.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={() => setFinished(false)}>
              Seguir un rato más
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/distraerme?jugar=solo')}>
              Elegir otro juego
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mx-auto max-w-md space-y-3">
          <div role="group" aria-label="Semilla para plantar" className="flex flex-wrap justify-center gap-2">
            {SPECIES.map((species) => (
              <button
                key={species}
                type="button"
                aria-pressed={seed === species}
                onClick={() => setSeed(species)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                  seed === species
                    ? 'border-transparent bg-listening-soft text-foreground shadow-soft'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="size-6 overflow-hidden" aria-hidden="true">
                  <PlantArt plant={{ species, stage: 3 }} headOnly />
                </span>
                {SPECIES_META[species].label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Tocá un cantero vacío para plantar, y una planta para regarla.
          </p>
        </div>
      )}
    </GameShell>
  );
}
