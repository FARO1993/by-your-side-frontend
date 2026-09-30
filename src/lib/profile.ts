export const EMPTY_DISPLAY_NAME = 'El nombre no puede quedar vacío.';

export function profileUpdatePayload(draft: { displayName: string; bio: string }):
  | { ok: true; body: { displayName: string; bio: string } }
  | { ok: false; message: string } {
  const displayName = draft.displayName.trim();
  if (!displayName) return { ok: false, message: EMPTY_DISPLAY_NAME };
  return { ok: true, body: { displayName, bio: draft.bio.trim() } };
}
