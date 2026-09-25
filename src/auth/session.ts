import axios, { type AxiosInstance } from 'axios';
import { authStorage } from './authStorage';
import { disconnectSocket, syncSocketAccessToken } from '../api/socket';

const NOTICE_KEY = 'byyourside.authNotice';

export const AUTH_NOTICES = {
  expired: 'Tu sesión expiró. Iniciá sesión nuevamente.',
  passwordChanged: 'Contraseña actualizada. Iniciá sesión nuevamente.',
  passwordReset: 'Tu contraseña fue restablecida. Iniciá sesión nuevamente.',
} as const;

export type SessionClearReason = 'expired' | 'logout' | 'password-changed' | 'password-reset';

interface RefreshResponseBody {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

type ClearedListener = (reason: SessionClearReason) => void;

const listeners = new Set<ClearedListener>();

let epoch = 0;
let refreshSuspended = false;
let refreshInFlight: Promise<string | null> | null = null;
let expiryNotified = false;

export const refreshClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function onSessionCleared(listener: ClearedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAuthNotice(message: string): void {
  try {
    sessionStorage.setItem(NOTICE_KEY, message);
  } catch {
    // sessionStorage no disponible
  }
}

export function consumeAuthNotice(): string | null {
  try {
    const message = sessionStorage.getItem(NOTICE_KEY);
    if (message) sessionStorage.removeItem(NOTICE_KEY);
    return message;
  } catch {
    return null;
  }
}

export function markAuthenticated(): void {
  expiryNotified = false;
  refreshSuspended = false;
}

export function isRefreshSuspended(): boolean {
  return refreshSuspended;
}

export function persistAuthResponse(response: { accessToken: string; refreshToken: string; expiresIn: number }): void {
  authStorage.setSession({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresIn: response.expiresIn,
  });
  markAuthenticated();
}

function notifyCleared(reason: SessionClearReason): void {
  for (const listener of listeners) listener(reason);
}

export function clearLocalSession(reason: SessionClearReason): void {
  epoch += 1;
  refreshSuspended = true;
  refreshInFlight = null;
  authStorage.clear();
  disconnectSocket();

  if (reason === 'expired') {
    expiryNotified = true;
    setAuthNotice(AUTH_NOTICES.expired);
  } else if (reason === 'password-changed') {
    setAuthNotice(AUTH_NOTICES.passwordChanged);
  } else if (reason === 'password-reset') {
    setAuthNotice(AUTH_NOTICES.passwordReset);
  }

  notifyCleared(reason);
}

export function invalidateSession(): void {
  if (expiryNotified) {
    authStorage.clear();
    refreshSuspended = true;
    return;
  }
  clearLocalSession('expired');
}

async function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  if (locks?.request) {
    return locks.request('byyourside-auth-refresh', () => task());
  }
  return task();
}

async function performRefresh(startedEpoch: number): Promise<string | null> {
  if (refreshSuspended || startedEpoch !== epoch) return null;

  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await refreshClient.post<RefreshResponseBody>('/api/auth/refresh', { refreshToken });
    if (refreshSuspended || startedEpoch !== epoch) return null;

    const data = response.data;
    if (!data?.accessToken || !data.refreshToken) {
      invalidateSession();
      return null;
    }

    authStorage.setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn ?? 900,
    });
    syncSocketAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    if (startedEpoch !== epoch) return null;
    invalidateSession();
    return null;
  }
}

export function refreshSession(): Promise<string | null> {
  if (refreshSuspended) return Promise.resolve(null);
  if (!authStorage.getRefreshToken()) return Promise.resolve(null);

  if (!refreshInFlight) {
    const startedEpoch = epoch;
    const flight = withRefreshLock(() => performRefresh(startedEpoch)).finally(() => {
      if (refreshInFlight === flight) refreshInFlight = null;
    });
    refreshInFlight = flight;
  }

  return refreshInFlight;
}

export async function endSession(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  clearLocalSession('logout');

  if (!refreshToken) return;

  try {
    await refreshClient.post('/api/auth/logout', { refreshToken });
  } catch {
    // El logout local ya se completó. Un backend caído no deja la sesión abierta en el cliente.
  }
}

export function resetAuthRuntime(): void {
  epoch = 0;
  refreshSuspended = false;
  refreshInFlight = null;
  expiryNotified = false;
  authStorage.clear();
  listeners.clear();
}
