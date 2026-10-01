/**
 * Borradores automáticos de texto (composer, crear post, chat, comentarios).
 *
 * Viven solo en este dispositivo (localStorage), separados por usuario y por
 * lugar. Como lo que se escribe acá puede ser muy íntimo:
 * - se borran todos al cerrar sesión o cambiar/restablecer la contraseña
 *   (ver clearLocalSession en auth/session.ts), pensando en dispositivos
 *   compartidos;
 * - vencen a los 7 días;
 * - un texto vacío o solo con espacios no se guarda.
 * Si la sesión expira sola, se conservan para poder retomar al volver.
 */

const PREFIX = 'byyourside.draft.';
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredDraft = { text: string; savedAt: number };

export type DraftScope =
  | 'feed-composer'
  | 'create-post'
  | `chat:${string}`
  | `comment:${string}`;

export function draftKey(userId: string | null | undefined, scope: DraftScope): string | null {
  return userId ? `${PREFIX}${userId}.${scope}` : null;
}

function storage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export function readDraft(key: string | null, now = Date.now()): string {
  if (!key) return '';
  const store = storage();
  try {
    const raw = store?.getItem(key);
    if (!raw) return '';
    const draft = JSON.parse(raw) as Partial<StoredDraft>;
    if (typeof draft.text !== 'string' || typeof draft.savedAt !== 'number' || now - draft.savedAt > DRAFT_TTL_MS) {
      store?.removeItem(key);
      return '';
    }
    return draft.text;
  } catch {
    store?.removeItem(key);
    return '';
  }
}

export function writeDraft(key: string | null, text: string, now = Date.now()): void {
  if (!key) return;
  const store = storage();
  try {
    if (!text.trim()) {
      store?.removeItem(key);
      return;
    }
    store?.setItem(key, JSON.stringify({ text, savedAt: now } satisfies StoredDraft));
  } catch {
    // Storage lleno o bloqueado: el borrador no se guarda, pero escribir sigue funcionando.
  }
}

export function clearDraft(key: string | null): void {
  if (!key) return;
  try {
    storage()?.removeItem(key);
  } catch {
    // nada que limpiar
  }
}

/** Borra todos los borradores de todos los usuarios de este dispositivo. */
export function clearAllDrafts(): void {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // nada que limpiar
  }
}
