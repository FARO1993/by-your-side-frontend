import type { ProfileVisibility } from '../api/types';

export const EMPTY_DISPLAY_NAME = 'El nombre no puede quedar vacío.';

export function profileUpdatePayload(draft: {
  displayName: string;
  bio: string;
  profileVisibility: ProfileVisibility;
}):
  | { ok: true; body: { displayName: string; bio: string; profileVisibility: ProfileVisibility } }
  | { ok: false; message: string } {
  const displayName = draft.displayName.trim();
  if (!displayName) return { ok: false, message: EMPTY_DISPLAY_NAME };
  return {
    ok: true,
    body: { displayName, bio: draft.bio.trim(), profileVisibility: draft.profileVisibility },
  };
}
