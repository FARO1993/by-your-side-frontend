/**
 * MOCK — extras de perfil que el backend aún no expone.
 * Real hoy: followersCount, followingCount, bio, avatar, posts.
 * Falta: agregado "presencia recibida" y edición de displayName/bio (solo hay avatar).
 * Futuro: GET/PATCH /api/users/me y un campo receivedPresenceCount.
 */

const overlayKey = (userId: string) => `bys.profileOverlay.${userId}`;

export type ProfileOverlay = {
  displayName?: string;
  bio?: string;
  receivedPresence?: number;
};

export function getProfileOverlay(userId: string): ProfileOverlay {
  try {
    const raw = localStorage.getItem(overlayKey(userId));
    return raw ? (JSON.parse(raw) as ProfileOverlay) : {};
  } catch {
    return {};
  }
}

export function saveProfileOverlay(userId: string, overlay: ProfileOverlay): void {
  const current = getProfileOverlay(userId);
  localStorage.setItem(overlayKey(userId), JSON.stringify({ ...current, ...overlay }));
}

export function mockReceivedPresence(followersCount: number, supportHint = 0): number {
  return supportHint || Math.max(followersCount * 2, 0);
}
