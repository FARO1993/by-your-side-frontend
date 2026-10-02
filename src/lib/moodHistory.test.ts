import { describe, expect, it } from 'vitest';
import { buildMoodDays, moodGroup, summarize } from './moodHistory';

const now = new Date(2026, 9, 2, 15, 0); // 2 oct 2026, 15hs local

function at(day: number, hour: number) {
  return new Date(2026, 9, day, hour, 0).toISOString();
}

describe('moodGroup', () => {
  it('splits moods into steadier and heavier days', () => {
    expect(moodGroup('WELL')).toBe('steady');
    expect(moodGroup('NEED_DISTRACTION')).toBe('steady');
    expect(moodGroup('HERE_FOR_SOMEONE')).toBe('steady');
    expect(moodGroup('DIFFICULT_DAY')).toBe('heavy');
    expect(moodGroup('NEED_TO_TALK')).toBe('heavy');
  });
});

describe('buildMoodDays', () => {
  it('returns one entry per local day, oldest first, ending today', () => {
    const days = buildMoodDays([], 7, now);
    expect(days).toHaveLength(7);
    expect(days[6].key).toBe('2026-10-02');
    expect(days[0].key).toBe('2026-09-26');
    expect(days.every((day) => day.mood === null)).toBe(true);
  });

  it('keeps the latest mood of each day', () => {
    const days = buildMoodDays(
      [
        { id: '1', mood: 'DIFFICULT_DAY', createdAt: at(2, 9) },
        { id: '2', mood: 'WELL', createdAt: at(2, 14) },
        { id: '3', mood: 'NEED_TO_TALK', createdAt: at(1, 20) },
      ],
      3,
      now,
    );
    expect(days[2]).toMatchObject({ key: '2026-10-02', mood: 'WELL', group: 'steady' });
    expect(days[1]).toMatchObject({ key: '2026-10-01', mood: 'NEED_TO_TALK', group: 'heavy' });
    expect(days[0].mood).toBeNull();
  });

  it('ignores entries outside the window', () => {
    const days = buildMoodDays([{ id: '1', mood: 'WELL', createdAt: at(20, 10) }], 7, now);
    expect(summarize(days).recorded).toBe(0);
  });
});

describe('summarize', () => {
  it('counts recorded days by group, not individual check-ins', () => {
    const days = buildMoodDays(
      [
        { id: '1', mood: 'WELL', createdAt: at(2, 9) },
        { id: '2', mood: 'WELL', createdAt: at(2, 10) },
        { id: '3', mood: 'DIFFICULT_DAY', createdAt: at(1, 10) },
      ],
      7,
      now,
    );
    expect(summarize(days)).toEqual({ recorded: 2, steady: 1, heavy: 1 });
  });
});
