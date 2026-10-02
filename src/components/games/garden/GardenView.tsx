import { Droplets } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { GARDEN_COLS, SPECIES, isBloomed, visitorCount, type DayPart, type GardenState, type Species } from '../../../lib/games/garden';
import { SPECIES_META, STAGE_LABEL } from '../../../lib/games/gardenSpecies';
import { PlantArt } from './PlantArt';

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

/**
 * El jardín dibujado: cielo según la hora, canteros y visitantes. Lo usan
 * el jardín propio y el compartido.
 */
export function GardenView({
  garden,
  part,
  seed,
  disabled,
  onTend,
  splash,
  highlight = null,
}: {
  garden: GardenState;
  part: DayPart;
  /** Semilla elegida (para decir qué se planta en un cantero vacío). */
  seed: Species;
  disabled: boolean;
  onTend: (index: number) => void;
  splash: { index: number; key: number } | null;
  /** Cantero que acaba de cuidar la otra persona. */
  highlight?: number | null;
}) {
  const visitors = visitorCount(garden);
  const night = part === 'night';
  return (
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
                onClick={() => onTend(index)}
                disabled={disabled}
                aria-label={label}
                className={cn(
                  'relative flex aspect-[4/5] items-end justify-center rounded-2xl bg-soil p-1 transition-colors',
                  !disabled && 'hover:bg-soil/80',
                  highlight === index && 'ring-2 ring-presence ring-offset-2 ring-offset-soil-deep',
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
  );
}

/** Elegir qué semilla plantar. */
export function SeedPicker({ seed, onChange }: { seed: Species; onChange: (species: Species) => void }) {
  return (
    <div role="group" aria-label="Semilla para plantar" className="flex flex-wrap justify-center gap-2">
      {SPECIES.map((species) => (
        <button
          key={species}
          type="button"
          aria-pressed={seed === species}
          onClick={() => onChange(species)}
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
  );
}
