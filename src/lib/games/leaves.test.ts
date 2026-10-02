import { describe, expect, it } from 'vitest';
import { LEAF_LANES, LEAF_MAX_CHARS, leafText, nextLane } from './leaves';

describe('leaves', () => {
  it('cleans up the text and ignores empty thoughts', () => {
    expect(leafText('  tengo   que   rendir\nmañana ')).toBe('tengo que rendir mañana');
    expect(leafText('   ')).toBeNull();
    expect(leafText('')).toBeNull();
    expect(leafText('a'.repeat(LEAF_MAX_CHARS + 30))).toHaveLength(LEAF_MAX_CHARS);
  });

  it('alternates lanes so leaves do not pile up', () => {
    const lanes = [nextLane(null)];
    for (let i = 0; i < 5; i += 1) lanes.push(nextLane(lanes[lanes.length - 1]));
    lanes.forEach((lane) => {
      expect(lane).toBeGreaterThanOrEqual(0);
      expect(lane).toBeLessThan(LEAF_LANES);
    });
    for (let i = 1; i < lanes.length; i += 1) expect(lanes[i]).not.toBe(lanes[i - 1]);
  });
});
