/**
 * MOCK — respuestas presence/listening extra sobre un post.
 * Real hoy: POST/DELETE /api/posts/:id/support (un solo apoyo binario).
 * La UI de v0 tiene 6 pills en dos filas. "Estoy con vos" se cablea al support real.
 * El resto se guarda en localStorage hasta que exista un contrato de reacciones de post.
 * Futuro: POST /api/posts/:id/responses { kind, optionId }.
 */

const storageKey = 'bys.postResponses';

type Store = Record<string, string | null>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(storageKey, JSON.stringify(store));
}

export function getMockPostResponse(postId: string): string | null {
  return readStore()[postId] ?? null;
}

export function setMockPostResponse(postId: string, optionId: string | null): void {
  const store = readStore();
  store[postId] = optionId;
  writeStore(store);
}
