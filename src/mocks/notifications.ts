/**
 * MOCK — marcar una notificación como leída.
 * Real hoy: PATCH /api/notifications/read-all (todas).
 * Futuro: PATCH /api/notifications/:id/read.
 */

const storageKey = 'bys.notificationRead';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isMockRead(id: string): boolean {
  return readIds().includes(id);
}

export function markMockRead(id: string): void {
  const ids = new Set(readIds());
  ids.add(id);
  localStorage.setItem(storageKey, JSON.stringify([...ids]));
}

export function markAllMockRead(ids: string[]): void {
  const set = new Set([...readIds(), ...ids]);
  localStorage.setItem(storageKey, JSON.stringify([...set]));
}
