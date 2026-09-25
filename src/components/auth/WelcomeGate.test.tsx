import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../api/types';
import { welcomeStorage } from '../../auth/welcomeStorage';

const auth = vi.hoisted(() => ({
  current: {
    user: null as User | null,
    status: 'unauthenticated' as 'initializing' | 'authenticated' | 'unauthenticated',
    loading: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => auth.current,
}));

import { WelcomeGate } from './WelcomeGate';

function person(id: string): User {
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

function mockMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && String(query).includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('WelcomeGate', () => {
  beforeEach(() => {
    auth.current.user = null;
    auth.current.status = 'unauthenticated';
    auth.current.loading = false;
    mockMotion(true);
  });

  it('stays hidden until the welcome is pending for that user', () => {
    auth.current.status = 'authenticated';
    auth.current.user = person('user-a');

    const { rerender } = render(
      <MemoryRouter>
        <WelcomeGate />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: /Bienvenido a ByYourSide/ })).not.toBeInTheDocument();

    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-a');
    rerender(
      <MemoryRouter>
        <WelcomeGate />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Bienvenido a ByYourSide, Ana/ })).toBeInTheDocument();
  });

  it('marks the welcome as seen only after it finishes', async () => {
    auth.current.status = 'authenticated';
    auth.current.user = person('user-a');
    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-a');

    render(
      <MemoryRouter>
        <WelcomeGate />
      </MemoryRouter>,
    );

    expect(welcomeStorage.hasSeen('user-a')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Empecemos 💜' }));
    await waitFor(() => expect(welcomeStorage.hasSeen('user-a')).toBe(true));
    expect(welcomeStorage.shouldShow('user-a')).toBe(false);
  });

  it('does not reuse another user welcome flag', () => {
    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-a');
    welcomeStorage.markSeen('user-a');

    auth.current.status = 'authenticated';
    auth.current.user = person('user-b');
    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('user-b');

    render(
      <MemoryRouter>
        <WelcomeGate />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Bienvenido a ByYourSide, Ana/ })).toBeInTheDocument();
    expect(welcomeStorage.hasSeen('user-b')).toBe(false);
  });
});
