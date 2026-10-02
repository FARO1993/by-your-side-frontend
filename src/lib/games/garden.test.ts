import { describe, expect, it } from 'vitest';
import {
  BLOOM_STAGE,
  GARDEN_COLS,
  GARDEN_MAX_ROWS,
  GARDEN_START_ROWS,
  bloomCount,
  createGarden,
  dayPart,
  growIfFull,
  parseGarden,
  plantSeed,
  visitorCount,
  water,
  type GardenState,
} from './garden';

function bloomAll(garden: GardenState): GardenState {
  return { ...garden, plots: garden.plots.map(() => ({ species: 'girasol' as const, stage: BLOOM_STAGE })) };
}

describe('garden', () => {
  it('starts small and empty', () => {
    const garden = createGarden();
    expect(garden.rows).toBe(GARDEN_START_ROWS);
    expect(garden.plots).toHaveLength(GARDEN_START_ROWS * GARDEN_COLS);
    expect(garden.plots.every((plot) => plot === null)).toBe(true);
  });

  it('plants only on empty plots', () => {
    const { garden, event } = plantSeed(createGarden(), 2, 'lavanda');
    expect(event).toBe('planted');
    expect(garden.plots[2]).toEqual({ species: 'lavanda', stage: 0 });
    expect(plantSeed(garden, 2, 'tulipan')).toEqual({ garden, event: 'ignored' });
    expect(plantSeed(garden, 99, 'tulipan').event).toBe('ignored');
  });

  it('grows one stage per watering until it blooms, then just stays in bloom', () => {
    let garden = plantSeed(createGarden(), 0, 'margarita').garden;
    const events: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const result = water(garden, 0);
      garden = result.garden;
      events.push(result.event);
    }
    expect(events).toEqual(['watered', 'watered', 'bloomed', 'already-bloomed']);
    expect(garden.plots[0]?.stage).toBe(BLOOM_STAGE);
    expect(water(garden, 1).event).toBe('ignored');
  });

  it('does not mutate the previous state', () => {
    const before = plantSeed(createGarden(), 0, 'tulipan').garden;
    water(before, 0);
    expect(before.plots[0]?.stage).toBe(0);
  });

  it('adds a row of plots when everything is in bloom, up to a limit', () => {
    const partial = plantSeed(createGarden(), 0, 'girasol').garden;
    expect(growIfFull(partial).grew).toBe(false);

    const grown = growIfFull(bloomAll(createGarden()));
    expect(grown.grew).toBe(true);
    expect(grown.garden.rows).toBe(GARDEN_START_ROWS + 1);
    expect(grown.garden.plots).toHaveLength((GARDEN_START_ROWS + 1) * GARDEN_COLS);
    expect(grown.garden.plots.slice(-GARDEN_COLS).every((plot) => plot === null)).toBe(true);

    const max = bloomAll({ version: 1, rows: GARDEN_MAX_ROWS, plots: Array(GARDEN_MAX_ROWS * GARDEN_COLS).fill(null) });
    expect(growIfFull(max).grew).toBe(false);
  });

  it('brings more visitors as more flowers bloom', () => {
    expect(visitorCount(createGarden())).toBe(0);
    const full = bloomAll(createGarden());
    expect(bloomCount(full)).toBe(GARDEN_START_ROWS * GARDEN_COLS);
    expect(visitorCount(full)).toBe(4);
  });

  it('knows the part of the day', () => {
    expect(dayPart(7)).toBe('morning');
    expect(dayPart(15)).toBe('afternoon');
    expect(dayPart(19)).toBe('evening');
    expect(dayPart(23)).toBe('night');
    expect(dayPart(3)).toBe('night');
  });

  it('reads back a saved garden and rejects anything broken', () => {
    const saved = water(plantSeed(createGarden(), 1, 'campanita').garden, 1).garden;
    expect(parseGarden(JSON.stringify(saved))).toEqual(saved);
    expect(parseGarden(null)).toBeNull();
    expect(parseGarden('{oops')).toBeNull();
    expect(parseGarden(JSON.stringify({ ...saved, version: 2 }))).toBeNull();
    expect(parseGarden(JSON.stringify({ ...saved, rows: 9 }))).toBeNull();
    expect(parseGarden(JSON.stringify({ ...saved, plots: saved.plots.slice(1) }))).toBeNull();
    const badPlant = saved.plots.slice();
    badPlant[0] = { species: 'cactus', stage: 1 } as never;
    expect(parseGarden(JSON.stringify({ ...saved, plots: badPlant }))).toBeNull();
    const badStage = saved.plots.slice();
    badStage[0] = { species: 'girasol', stage: 7 };
    expect(parseGarden(JSON.stringify({ ...saved, plots: badStage }))).toBeNull();
  });
});
