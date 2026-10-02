/**
 * Jardín: plantar, regar y ver florecer. Sin puntaje y, sobre todo, sin
 * castigo por no volver: las plantas nunca se marchitan ni "te extrañan".
 * Cuando todos los canteros florecen, el jardín crece una fila.
 *
 * Lógica pura y serializable: hoy se guarda en el dispositivo; más adelante
 * el mismo estado puede vivir en el backend para un jardín compartido.
 */
export const GARDEN_COLS = 4;
export const GARDEN_START_ROWS = 2;
export const GARDEN_MAX_ROWS = 5;
/** Etapas: 0 semilla, 1 brote, 2 capullo, 3 flor. Cada riego avanza una. */
export const BLOOM_STAGE = 3;

export const SPECIES = ['margarita', 'tulipan', 'girasol', 'lavanda', 'campanita'] as const;
export type Species = (typeof SPECIES)[number];

export type Plant = { species: Species; stage: number };

export type GardenState = {
  version: 1;
  rows: number;
  plots: (Plant | null)[];
};

export type GardenEvent = 'planted' | 'watered' | 'bloomed' | 'already-bloomed' | 'ignored';

export function createGarden(): GardenState {
  return { version: 1, rows: GARDEN_START_ROWS, plots: Array(GARDEN_COLS * GARDEN_START_ROWS).fill(null) };
}

export function isBloomed(plant: Plant | null): boolean {
  return plant !== null && plant.stage >= BLOOM_STAGE;
}

export function bloomCount(garden: GardenState): number {
  return garden.plots.filter(isBloomed).length;
}

export function plantSeed(garden: GardenState, index: number, species: Species): { garden: GardenState; event: GardenEvent } {
  if (index < 0 || index >= garden.plots.length || garden.plots[index] !== null) {
    return { garden, event: 'ignored' };
  }
  const plots = garden.plots.slice();
  plots[index] = { species, stage: 0 };
  return { garden: { ...garden, plots }, event: 'planted' };
}

export function water(garden: GardenState, index: number): { garden: GardenState; event: GardenEvent } {
  const plant = garden.plots[index];
  if (!plant) return { garden, event: 'ignored' };
  if (isBloomed(plant)) return { garden, event: 'already-bloomed' };
  const plots = garden.plots.slice();
  const stage = plant.stage + 1;
  plots[index] = { ...plant, stage };
  return { garden: { ...garden, plots }, event: stage >= BLOOM_STAGE ? 'bloomed' : 'watered' };
}

/** Si todo está en flor (y queda lugar), suma una fila de canteros vacíos. */
export function growIfFull(garden: GardenState): { garden: GardenState; grew: boolean } {
  const full = garden.plots.every(isBloomed);
  if (!full || garden.rows >= GARDEN_MAX_ROWS) return { garden, grew: false };
  return {
    garden: {
      ...garden,
      rows: garden.rows + 1,
      plots: [...garden.plots, ...Array<Plant | null>(GARDEN_COLS).fill(null)],
    },
    grew: true,
  };
}

/** Visitantes decorativos: aparecen más a medida que hay más flores. */
export function visitorCount(garden: GardenState): number {
  return Math.min(4, Math.floor(bloomCount(garden) / 2));
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export function dayPart(hour: number): DayPart {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

function isPlant(value: unknown): value is Plant {
  if (typeof value !== 'object' || value === null) return false;
  const plant = value as Record<string, unknown>;
  return (
    SPECIES.includes(plant.species as Species) &&
    typeof plant.stage === 'number' &&
    Number.isInteger(plant.stage) &&
    plant.stage >= 0 &&
    plant.stage <= BLOOM_STAGE
  );
}

/** Lee un jardín guardado; si algo no cierra, devuelve null (y se empieza uno nuevo). */
export function parseGarden(raw: string | null): GardenState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const rows = data.rows;
    const plots = data.plots;
    if (data.version !== 1 || typeof rows !== 'number' || !Number.isInteger(rows)) return null;
    if (rows < GARDEN_START_ROWS || rows > GARDEN_MAX_ROWS) return null;
    if (!Array.isArray(plots) || plots.length !== rows * GARDEN_COLS) return null;
    if (!plots.every((plot) => plot === null || isPlant(plot))) return null;
    return {
      version: 1,
      rows,
      plots: plots.map((plot: Plant | null) => (plot ? { species: plot.species, stage: plot.stage } : null)),
    };
  } catch {
    return null;
  }
}
