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
      <button type="button" onClick={() => void auth.register({ email: 'ana@example.com', password: 'secretpass', displayName: 'Ana' })}>
        Registrar
      </button>
      <button type="button" onClick={() => void auth.login({ email: 'ana@example.com', password: 'secretpass' })}>
        Ingresar
      </button>
    </div>
  );
}

describe('AuthContext session', () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
    currentUserMock.mockReset();
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
  });

  it('login stores the session and does not show the welcome', async () => {
    loginMock.mockResolvedValue(authResponse);
    currentUserMock.mockResolvedValue(user('user-b'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('unauthenticated')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(screen.getByText('authenticated')).toBeInTheDocument());
    expect(authStorage.getRefreshToken()).toBe('refresh-1');
    expect(welcomeStorage.shouldShow('user-b')).toBe(false);
  });
});
