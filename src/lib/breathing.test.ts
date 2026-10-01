import { describe, expect, it } from 'vitest';
import { BREATH_CYCLES, TOTAL_SECONDS, breathStateAt } from './breathing';

describe('breathStateAt', () => {
  it('follows inhale 4 · hold 4 · exhale 6', () => {
    expect(breathStateAt(0)).toMatchObject({ phase: 'inhale', remaining: 4, cycle: 1 });
    expect(breathStateAt(3)).toMatchObject({ phase: 'inhale', remaining: 1 });
    expect(breathStateAt(4)).toMatchObject({ phase: 'hold', remaining: 4 });
    expect(breathStateAt(8)).toMatchObject({ phase: 'exhale', remaining: 6 });
    expect(breathStateAt(13)).toMatchObject({ phase: 'exhale', remaining: 1, cycle: 1 });
    expect(breathStateAt(14)).toMatchObject({ phase: 'inhale', cycle: 2 });
  });

  it('lasts about a minute and then ends', () => {
    expect(BREATH_CYCLES).toBe(4);
    expect(TOTAL_SECONDS).toBe(56);
    expect(breathStateAt(55)).toMatchObject({ phase: 'exhale', cycle: 4, remaining: 1 });
    expect(breathStateAt(56)).toBeNull();
  });
});
