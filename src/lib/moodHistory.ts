import type { MoodHistoryEntry, StatusMood } from '../api/types';
import { STATUS_MOOD_UI, moodToneToBadgeTone } from './visual';

/** steady = días más tranquilos · heavy = días más pesados. Mismo criterio que los badges. */
export type MoodGroup = 'steady' | 'heavy';

export type MoodDay = {
  /** YYYY-MM-DD en la zona horaria del dispositivo. */
  key: string;
  date: Date;
  /** Último ánimo registrado ese día, o null si no hubo registro. */
  mood: StatusMood | null;
  group: MoodGroup | null;
};

export function moodGroup(mood: StatusMood): MoodGroup {
  return moodToneToBadgeTone(STATUS_MOOD_UI[mood].tone) === 'listening' ? 'steady' : 'heavy';
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Los últimos `days` días (el más viejo primero), cada uno con su último ánimo.
 * Varios registros el mismo día: cuenta el más reciente, que es "cómo terminó".
 */
export function buildMoodDays(entries: MoodHistoryEntry[], days: number, now = new Date()): MoodDay[] {
  const latestByDay = new Map<string, { at: number; mood: StatusMood }>();
  for (const entry of entries) {
    const at = new Date(entry.createdAt);
    const key = dayKey(at);
    const current = latestByDay.get(key);
    if (!current || at.getTime() > current.at) latestByDay.set(key, { at: at.getTime(), mood: entry.mood });
  }

  const result: MoodDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = dayKey(date);
    const mood = latestByDay.get(key)?.mood ?? null;
    result.push({ key, date, mood, group: mood ? moodGroup(mood) : null });
  }
  return result;
}

export function summarize(days: MoodDay[]): { recorded: number; steady: number; heavy: number } {
  let steady = 0;
  let heavy = 0;
  for (const day of days) {
    if (day.group === 'steady') steady += 1;
    if (day.group === 'heavy') heavy += 1;
  }
  return { recorded: steady + heavy, steady, heavy };
}
