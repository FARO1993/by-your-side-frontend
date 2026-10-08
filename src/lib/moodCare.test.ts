import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOOD_CARE, localDay, moodCareStorage } from './moodCare';

describe('moodCare', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('has gentle, concrete options for every mood, and points to help only for the heaviest ones', () => {
    Object.values(MOOD_CARE).forEach((care) => {
      expect(care.actions.length).toBeGreaterThan(0);
      expect(care.actions.length).toBeLessThanOrEqual(3);
    });
    expect(MOOD_CARE.DIFFICULT_DAY.showHelp).toBe(true);
    expect(MOOD_CARE.NEED_TO_TALK.showHelp).toBe(true);
    expect(MOOD_CARE.WELL.showHelp).toBe(false);
    expect(MOOD_CARE.NEED_DISTRACTION.actions.map((a) => a.label)).toContain('Jugar algo tranquilo');
  });

  it('uses the local day', () => {
    expect(localDay(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
    expect(localDay(new Date(2026, 0, 2, 0, 1))).toBe('2026-01-02');
  });

  it('remembers "ahora no" only for that mood and that day', () => {
    const today = new Date(2026, 9, 8, 10);
    moodCareStorage.dismiss('u1', 'DIFFICULT_DAY', today);
    expect(moodCareStorage.isDismissed('u1', 'DIFFICULT_DAY', today)).toBe(true);
    expect(moodCareStorage.isDismissed('u1', 'NEED_DISTRACTION', today)).toBe(false);
    expect(moodCareStorage.isDismissed('u2', 'DIFFICULT_DAY', today)).toBe(false);
    expect(moodCareStorage.isDismissed('u1', 'DIFFICULT_DAY', new Date(2026, 9, 9, 10))).toBe(false);

    moodCareStorage.dismiss('u1', 'NEED_DISTRACTION', today);
    expect(moodCareStorage.isDismissed('u1', 'DIFFICULT_DAY', today)).toBe(true);
    expect(moodCareStorage.isDismissed('u1', 'NEED_DISTRACTION', today)).toBe(true);
  });

  it('never breaks without storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(moodCareStorage.isDismissed('u1', 'WELL')).toBe(false);
    expect(() => moodCareStorage.dismiss('u1', 'WELL')).not.toThrow();
  });
});
