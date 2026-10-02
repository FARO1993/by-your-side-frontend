import type { Plant } from '../../../lib/games/garden';
import { SPECIES_META } from '../../../lib/games/gardenSpecies';

const LEAF = 'var(--leaf)';

function Stem({ height }: { height: number }) {
  return <path d={`M20 44 C 19 ${44 - height / 2}, 21 ${44 - height / 2}, 20 ${44 - height}`} stroke={LEAF} strokeWidth="2" strokeLinecap="round" fill="none" />;
}

function Leaves({ y, size }: { y: number; size: number }) {
  return (
    <g fill={LEAF}>
      <ellipse cx={20 - size * 0.9} cy={y} rx={size} ry={size * 0.45} transform={`rotate(-28 ${20 - size * 0.9} ${y})`} />
      <ellipse cx={20 + size * 0.9} cy={y - 2} rx={size} ry={size * 0.45} transform={`rotate(28 ${20 + size * 0.9} ${y - 2})`} />
    </g>
  );
}

function Petals({ cx, cy, count, rx, ry, distance, fill }: { cx: number; cy: number; count: number; rx: number; ry: number; distance: number; fill: string }) {
  return (
    <g fill={fill}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (360 / count) * i;
        return <ellipse key={i} cx={cx} cy={cy - distance} rx={rx} ry={ry} transform={`rotate(${angle} ${cx} ${cy})`} />;
      })}
    </g>
  );
}

function Bloom({ plant }: { plant: Plant }) {
  const { petal, center } = SPECIES_META[plant.species];
  switch (plant.species) {
    case 'margarita':
      return (
        <g>
          <Stem height={26} />
          <Leaves y={34} size={4.5} />
          <Petals cx={20} cy={14} count={10} rx={2} ry={4.2} distance={4.6} fill={petal} />
          <circle cx={20} cy={14} r={3} fill={center} />
        </g>
      );
    case 'tulipan':
      return (
        <g>
          <Stem height={24} />
          <Leaves y={36} size={5} />
          <path d="M13 13 C 13 22, 27 22, 27 13 L 24 16 L 20 10 L 16 16 Z" fill={petal} />
          <path d="M20 10 L 17.5 17 C 19 19, 21 19, 22.5 17 Z" fill={center} opacity="0.55" />
        </g>
      );
    case 'girasol':
      return (
        <g>
          <Stem height={30} />
          <Leaves y={33} size={5.5} />
          <Petals cx={20} cy={11} count={14} rx={1.9} ry={4.4} distance={6} fill={petal} />
          <circle cx={20} cy={11} r={4.4} fill={center} />
        </g>
      );
    case 'lavanda':
      return (
        <g>
          <Stem height={30} />
          <Leaves y={38} size={4} />
          <g fill={petal}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i}>
                <ellipse cx={18.6} cy={14 + i * 2.6} rx={1.6} ry={1.4} />
                <ellipse cx={21.4} cy={15.2 + i * 2.6} rx={1.6} ry={1.4} />
              </g>
            ))}
            <ellipse cx={20} cy={12} rx={1.4} ry={1.6} fill={center} />
          </g>
        </g>
      );
    case 'campanita':
      return (
        <g>
          <path d="M20 44 C 19 34, 20 22, 21 16 C 22 12, 27 10, 29 13" stroke={LEAF} strokeWidth="2" strokeLinecap="round" fill="none" />
          <Leaves y={36} size={4.5} />
          <path d="M24 15 C 24 21, 25 23, 26.5 23.5 L 31.5 23.5 C 33 23, 34 21, 34 15 C 33 11, 25 11, 24 15 Z" fill={petal} />
          <path d="M26.5 23.5 L 25 25.5 M 29 23.5 L 29 25.8 M 31.5 23.5 L 33 25.5" stroke={petal} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx={29} cy={25} r={1.1} fill={center} />
        </g>
      );
  }
}

/** Encuadre de la flor sola, para los íconos de semillas. */
const HEAD_VIEWBOX: Record<Plant['species'], string> = {
  margarita: '9 3 22 22',
  tulipan: '10 5 20 20',
  girasol: '8 -1 24 24',
  lavanda: '9 9 22 22',
  campanita: '20 8 18 18',
};

/** Ilustración propia de cada planta según su etapa (semilla → flor). */
export function PlantArt({ plant, headOnly = false }: { plant: Plant; headOnly?: boolean }) {
  const { petal } = SPECIES_META[plant.species];
  return (
    <svg viewBox={headOnly ? HEAD_VIEWBOX[plant.species] : '0 0 40 48'} className="h-full w-full overflow-visible" aria-hidden="true" focusable="false">
      {plant.stage === 0 ? (
        <g>
          <ellipse cx={20} cy={43} rx={8} ry={3} fill="var(--soil-deep)" />
          <ellipse cx={20} cy={41.5} rx={2} ry={1.3} fill={LEAF} opacity="0.7" />
        </g>
      ) : null}
      {plant.stage === 1 ? (
        <g>
          <Stem height={10} />
          <Leaves y={35} size={3.6} />
        </g>
      ) : null}
      {plant.stage === 2 ? (
        <g>
          <Stem height={22} />
          <Leaves y={36} size={4.6} />
          <ellipse cx={20} cy={21} rx={3} ry={4.2} fill={petal} />
          <path d="M17 22 C 18 25, 22 25, 23 22" stroke={LEAF} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      {plant.stage >= 3 ? <Bloom plant={plant} /> : null}
    </svg>
  );
}
