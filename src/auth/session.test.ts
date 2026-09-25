import { describe, expect, it, vi } from 'vitest';
import apiClient from '../api/client';
import type { AuthResponse } from '../api/types';
import { applyPasswordChange, applyPasswordReset } from './accountActions';
import { authStorage } from './authStorage';
import { classifyVerifyError, loginErrorMessage, registerErrorMessage } from './apiError';
import { AUTH_NOTICES, endSession, persistAuthResponse, refreshClient } from './session';
import { welcomeStorage } from './welcomeStorage';
import { authorizationHeader, installAdapter, requestBody } from '../test/http';
import type { InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';

const session: AuthResponse = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  username: 'ana',
  role: 'USER',
};

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('auth contract and storage', () => {
  it('persists accessToken and refreshToken from the new auth response', () => {
    persistAuthResponse(session);

    expect(authStorage.getAccessToken()).toBe('access-1');
    expect(authStorage.getRefreshToken()).toBe('refresh-1');
    expect(localStorage.getItem('byyourside.refreshToken')).toBe('refresh-1');
    expect(sessionStorage.getItem('byyourside.accessToken')).toBe('access-1');
  });

  it('does not keep the legacy token field', () => {
    localStorage.setItem('token', 'legacy-jwt');
    persistAuthResponse(session);

    expect(localStorage.getItem('token')).toBeNull();
    expect(session).not.toHaveProperty('token');
    expect(JSON.stringify(session)).not.toContain('"token"');
  });

  it('drops an expired access token on reload and keeps the refresh token', () => {
    persistAuthResponse(session);
    sessionStorage.setItem('byyourside.accessExpiresAt', String(Date.now() - 1000));
    authStorage.clearAccess();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBe('refresh-1');
  });
});

describe('api client session refresh', () => {
  it('sends Authorization with the access token and skips public auth endpoints', async () => {
    persistAuthResponse(session);
    const seen: string[] = [];

    installAdapter(apiClient, (config) => {
      seen.push(`${config.url}|${authorizationHeader(config)}`);
      return { status: 200, data: { ok: true } };
    });

    await apiClient.get('/api/users/me');
    await apiClient.post('/api/auth/login', { email: 'a@b.c', password: 'secret' });

    expect(seen[0]).toBe('/api/users/me|Bearer access-1');
    expect(seen[1]).toBe('/api/auth/login|');
  });

  it('refreshes once on 401, retries the original request, and replaces the refresh token', async () => {
    persistAuthResponse(session);
    const refreshCalls: string[] = [];

    installAdapter(refreshClient, (config) => {
      refreshCalls.push(String(requestBody(config).refreshToken));
      return {
        status: 200,
        data: {
          accessToken: 'access-2',
          refreshToken: 'refresh-2',
          tokenType: 'Bearer',
          expiresIn: 900,
        },
      };
    });

    installAdapter(apiClient, (config) => {
      if (authorizationHeader(config) === 'Bearer access-2') {
        return { status: 200, data: { content: ['ok'] } };
      }
      return { status: 401, data: { message: 'expired' } };
    });

    const response = await apiClient.get('/api/posts/feed');

    expect(response.data).toEqual({ content: ['ok'] });
    expect(refreshCalls).toEqual(['refresh-1']);
    expect(authStorage.getAccessToken()).toBe('access-2');
    expect(authStorage.getRefreshToken()).toBe('refresh-2');
  });

  it('shares one refresh across simultaneous 401 responses', async () => {
    persistAuthResponse(session);
    let refreshCalls = 0;
    const gate = deferred<{
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      expiresIn: number;
    }>();

    installAdapter(refreshClient, async () => {
      refreshCalls += 1;
      const data = await gate.promise;
      return { status: 200, data };
    });

    installAdapter(apiClient, (config) => {
      if (authorizationHeader(config) === 'Bearer access-2') {
        return { status: 200, data: { ok: true } };
      }
      return { status: 401, data: {} };
    });

    const requests = [apiClient.get('/api/posts/feed'), apiClient.get('/api/statuses/feed'), apiClient.get('/api/conversations')];
    await vi.waitFor(() => expect(refreshCalls).toBe(1));

    gate.resolve({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    const responses = await Promise.all(requests);
    expect(responses).toHaveLength(3);
    expect(refreshCalls).toBe(1);
    expect(authStorage.getRefreshToken()).toBe('refresh-2');
  });

  it('does not refresh again when /api/auth/refresh returns 401', async () => {
    persistAuthResponse(session);
    let refreshCalls = 0;

    installAdapter(refreshClient, () => {
      refreshCalls += 1;
      return { status: 401, data: { message: 'no' } };
    });
    installAdapter(apiClient, () => ({ status: 401, data: {} }));

    await expect(apiClient.get('/api/users/me')).rejects.toBeInstanceOf(AxiosError);
    await expect(apiClient.get('/api/users/me')).rejects.toBeInstanceOf(AxiosError);

    expect(refreshCalls).toBe(1);
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('byyourside.authNotice')).toBe(AUTH_NOTICES.expired);
  });

  it('clears the session when refresh fails and does not loop', async () => {
    persistAuthResponse(session);
    let refreshCalls = 0;

    installAdapter(refreshClient, () => {
      refreshCalls += 1;
      return { status: 400, data: { message: 'Refresh token has been revoked' } };
    });
    installAdapter(apiClient, (config: InternalAxiosRequestConfig) => {
      if (config._retry) return { status: 401, data: {} };
      return { status: 401, data: {} };
    });

    await expect(apiClient.get('/api/posts/feed')).rejects.toBeInstanceOf(AxiosError);

    expect(refreshCalls).toBe(1);
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('byyourside.authNotice')).toBe(AUTH_NOTICES.expired);
  });
});

describe('logout, password change, and reset', () => {
  it('calls logout and still clears the session when the backend fails', async () => {
    persistAuthResponse(session);
    let logoutBody: unknown = null;

    installAdapter(refreshClient, (config) => {
      logoutBody = requestBody(config);
      return { status: 500, data: {} };
    });

    await endSession();

    expect(logoutBody).toEqual({ refreshToken: 'refresh-1' });
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('byyourside.authNotice')).toBeNull();
  });

  it('clears the session after a successful password change and does not refresh afterwards', async () => {
    persistAuthResponse(session);
    let refreshCalls = 0;
    let changeBody: unknown = null;

    installAdapter(refreshClient, () => {
      refreshCalls += 1;
      return { status: 200, data: {} };
    });
    installAdapter(apiClient, (config) => {
      changeBody = requestBody(config);
      return { status: 200, data: { message: 'Password changed successfully.' } };
    });

    await applyPasswordChange({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' });

    expect(changeBody).toEqual({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' });
    expect(changeBody).not.toHaveProperty('confirmNewPassword');
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('byyourside.authNotice')).toBe(AUTH_NOTICES.passwordChanged);

    installAdapter(apiClient, () => ({ status: 401, data: {} }));
    await expect(apiClient.get('/api/users/me')).rejects.toBeInstanceOf(AxiosError);
    expect(refreshCalls).toBe(0);
  });

  it('resets the password without creating a session', async () => {
    persistAuthResponse(session);
    let resetBody: unknown = null;

    installAdapter(apiClient, (config) => {
      resetBody = requestBody(config);
      return {
        status: 200,
        data: {
          message: 'Your password has been reset successfully.',
          accessToken: 'should-not-stick',
          refreshToken: 'should-not-stick',
        },
      };
    });

    await applyPasswordReset({ token: 'reset-token', newPassword: 'new-pass-1' });

    expect(resetBody).toEqual({ token: 'reset-token', newPassword: 'new-pass-1' });
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('byyourside.authNotice')).toBe(AUTH_NOTICES.passwordReset);
  });
});

describe('account error copy', () => {
  it('keeps login and register failures generic', () => {
    const offline = new AxiosError('Network Error');
    expect(loginErrorMessage(offline)).toMatch(/conectar/i);

    const invalid = new AxiosError('no');
    invalid.response = {
      status: 401,
      data: { message: 'Invalid username or password' },
      statusText: 'Unauthorized',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };
    expect(loginErrorMessage(invalid)).toBe('El correo o la contraseña no son correctos.');

    const conflict = new AxiosError('no');
    conflict.response = {
      status: 409,
      data: { message: 'Email already registered' },
      statusText: 'Conflict',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };
    expect(registerErrorMessage(conflict)).toBe('Ya existe una cuenta con ese correo.');
  });

  it('classifies verification failures without echoing the token', () => {
    const expired = new AxiosError('no');
    expired.response = {
      status: 400,
      data: { message: 'Verification token has expired' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };
    expect(classifyVerifyError(expired)).toBe('expired');
    expect(JSON.stringify(classifyVerifyError(expired))).not.toMatch(/token/i);
  });
});

describe('welcome seen', () => {
  it('shows only for the user who just registered and not for another account', () => {
    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-a');

    expect(welcomeStorage.shouldShow('user-a')).toBe(true);
    expect(welcomeStorage.shouldShow('user-b')).toBe(false);

    welcomeStorage.markSeen('user-a');
    expect(welcomeStorage.shouldShow('user-a')).toBe(false);
    expect(welcomeStorage.hasSeen('user-b')).toBe(false);

    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-b');
    expect(welcomeStorage.shouldShow('user-b')).toBe(true);
    expect(welcomeStorage.shouldShow('user-a')).toBe(false);
  });

  it('does not mark welcome as seen before it finishes', () => {
    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-a');
    expect(welcomeStorage.hasSeen('user-a')).toBe(false);
    expect(welcomeStorage.shouldShow('user-a')).toBe(true);
  });
});
