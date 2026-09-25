/**
 * Acceso centralizado a los tokens de sesión.
 *
 * Fase 1.6 (transitorio):
 * - accessToken vive en memoria y se espeja en sessionStorage para poder
 *   reutilizarlo en un reload de la misma pestaña mientras no expiró.
 * - refreshToken vive en localStorage para sobrevivir al reload.
 *
 * Deuda: migrar el refresh token a una cookie HttpOnly Secure SameSite en una
 * fase futura. No implementar cookies ni CSRF en esta fase.
 */

const REFRESH_KEY = 'byyourside.refreshToken';
const ACCESS_KEY = 'byyourside.accessToken';
const ACCESS_EXPIRES_AT_KEY = 'byyourside.accessExpiresAt';
const LEGACY_TOKEN_KEY = 'token';

const EXPIRY_SKEW_MS = 5_000;

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

let memoryAccessToken: string | null = null;

function browserStorage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

function dropLegacyToken(): void {
  browserStorage('local')?.removeItem(LEGACY_TOKEN_KEY);
}

dropLegacyToken();

export const authStorage = {
  getAccessToken(): string | null {
    if (memoryAccessToken) return memoryAccessToken;
    return this.hydrateAccessToken();
  },

  hydrateAccessToken(): string | null {
    const storage = browserStorage('session');
    if (!storage) return null;

    const token = storage.getItem(ACCESS_KEY);
    const expiresAt = Number(storage.getItem(ACCESS_EXPIRES_AT_KEY));
    if (!token || !Number.isFinite(expiresAt) || Date.now() >= expiresAt - EXPIRY_SKEW_MS) {
      this.clearAccess();
      return null;
    }

    memoryAccessToken = token;
    return token;
  },

  getRefreshToken(): string | null {
    return browserStorage('local')?.getItem(REFRESH_KEY) ?? null;
  },

  setSession(session: StoredSession): void {
    if (!session.accessToken || !session.refreshToken) return;

    memoryAccessToken = session.accessToken;
    const lifetimeSeconds = Number.isFinite(session.expiresIn) && session.expiresIn > 0 ? session.expiresIn : 900;
    const expiresAt = Date.now() + lifetimeSeconds * 1000;
    const tabStorage = browserStorage('session');
    tabStorage?.setItem(ACCESS_KEY, session.accessToken);
    tabStorage?.setItem(ACCESS_EXPIRES_AT_KEY, String(expiresAt));

    const persistent = browserStorage('local');
    persistent?.setItem(REFRESH_KEY, session.refreshToken);
    persistent?.removeItem(LEGACY_TOKEN_KEY);
  },

  clearAccess(): void {
    memoryAccessToken = null;
    const tabStorage = browserStorage('session');
    tabStorage?.removeItem(ACCESS_KEY);
    tabStorage?.removeItem(ACCESS_EXPIRES_AT_KEY);
  },

  clear(): void {
    this.clearAccess();
    const persistent = browserStorage('local');
    persistent?.removeItem(REFRESH_KEY);
    persistent?.removeItem(LEGACY_TOKEN_KEY);
  },
};
