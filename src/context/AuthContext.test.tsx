import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthResponse, User } from '../api/types';
import { authStorage } from '../auth/authStorage';
import { welcomeStorage } from '../auth/welcomeStorage';

vi.mock('../api/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  syncSocketAccessToken: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser, login, register } from '../api/auth';
import * as sessionModule from '../auth/session';
import { AuthProvider, useAuth } from './AuthContext';

const loginMock = vi.mocked(login);
const registerMock = vi.mocked(register);
const currentUserMock = vi.mocked(getCurrentUser);

const authResponse: AuthResponse = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  username: 'ana',
  role: 'USER',
};

function user(id: string): User {
  return {
    id,
    username: 'ana',
    email: 'ana@example.com',
    displayName: 'Ana',
    bio: null,
    avatarUrl: null,
    role: 'USER',
    createdAt: '2026-09-25T00:00:00Z',
    emailVerified: false,
    emailVerifiedAt: null,
  };
}

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.showReturningWelcome ? 'returning-welcome' : 'no-returning'}</span>
      <button type="button" onClick={() => void auth.register({ email: 'ana@example.com', password: 'secretpass', displayName: 'Ana' })}>
        Registrar
      </button>
      <button type="button" onClick={() => void auth.login({ email: 'ana@example.com', password: 'secretpass' })}>
        Ingresar
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        Salir
      </button>
    </div>
  );
}

describe('AuthContext session', () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
    currentUserMock.mockReset();
    authStorage.clear();
  });

  it('register stores access and refresh tokens and arms the welcome', async () => {
    registerMock.mockResolvedValue(authResponse);
    currentUserMock.mockResolvedValue(user('user-a'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('unauthenticated')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => expect(screen.getByText('authenticated')).toBeInTheDocument());
    expect(authStorage.getAccessToken()).toBe('access-1');
    expect(authStorage.getRefreshToken()).toBe('refresh-1');
    expect(localStorage.getItem('token')).toBeNull();
    expect(welcomeStorage.shouldShow('user-a')).toBe(true);
    expect(screen.getByText('no-returning')).toBeInTheDocument();
  });

  it('login stores the session and arms returning welcome without welcomeSeen', async () => {
    loginMock.mockResolvedValue(authResponse);
    currentUserMock.mockResolvedValue(user('user-b'));
    welcomeStorage.markSeen('user-b');

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('unauthenticated')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(screen.getByText('returning-welcome')).toBeInTheDocument());
    expect(authStorage.getRefreshToken()).toBe('refresh-1');
    expect(welcomeStorage.shouldShow('user-b')).toBe(false);
    expect(welcomeStorage.hasSeen('user-b')).toBe(true);
  });

  it('reload with an existing session does not arm returning welcome', async () => {
    authStorage.setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 900 });
    currentUserMock.mockResolvedValue(user('user-reload'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('authenticated')).toBeInTheDocument());
    expect(screen.getByText('no-returning')).toBeInTheDocument();
    expect(welcomeStorage.hasSeen('user-reload')).toBe(false);
  });

  it('a silent refresh does not arm returning welcome', async () => {
    const refreshSpy = vi.spyOn(sessionModule, 'refreshSession').mockResolvedValue('access-restored');
    localStorage.setItem('byyourside.refreshToken', 'refresh-kept');
    currentUserMock.mockResolvedValue(user('user-refresh'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('authenticated')).toBeInTheDocument());
    expect(refreshSpy).toHaveBeenCalled();
    expect(screen.getByText('no-returning')).toBeInTheDocument();
    refreshSpy.mockRestore();
  });

  it('logout clears returning welcome and the next login shows it again', async () => {
    vi.spyOn(sessionModule, 'endSession').mockResolvedValue(undefined);
    loginMock.mockResolvedValue(authResponse);
    currentUserMock.mockResolvedValue(user('user-b'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('unauthenticated')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(screen.getByText('returning-welcome')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
    await waitFor(() => expect(screen.getByText('no-returning')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(screen.getByText('returning-welcome')).toBeInTheDocument());
    expect(welcomeStorage.hasSeen('user-b')).toBe(false);
    vi.mocked(sessionModule.endSession).mockRestore();
  });
});
