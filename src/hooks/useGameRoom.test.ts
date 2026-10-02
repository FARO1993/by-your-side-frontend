import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../api/gameRooms';
import { mergeEvents } from './useGameRoom';

const ev = (seq: number, type = 'FLIP'): GameEvent => ({ roomId: 'r', seq, actorId: 'a', type, payload: {}, createdAt: '' });

describe('mergeEvents', () => {
  it('keeps events unique and in seq order', () => {
    const merged = mergeEvents([ev(1), ev(3)], [ev(2), ev(3, 'RESTART'), ev(4)]);
    expect(merged.map((e) => e.seq)).toEqual([1, 2, 3, 4]);
    expect(merged[2].type).toBe('RESTART');
  });

  it('returns the same array when nothing new arrives', () => {
    const current = [ev(1)];
    expect(mergeEvents(current, [])).toBe(current);
  });
});
