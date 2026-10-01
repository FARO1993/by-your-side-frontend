import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { armAuthTransition } from './authTransition';
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
    showReturningWelcome: false,
    clearReturningWelcome: vi.fn(),
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
    auth.current.showReturningWelcome = false;
    auth.current.clearReturningWelcome = vi.fn();
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

  it('shows returning-user after a manual login and then goes to the feed', async () => {
    auth.current.status = 'authenticated';
    auth.current.user = person('user-a');
    welcomeStorage.markSeen('user-a');

    function LocationProbe() {
      return <span>{useLocation().pathname}</span>;
    }

    function Harness() {
      auth.current.clearReturningWelcome = vi.fn(() => {
        auth.current.showReturningWelcome = false;
      });
      return (
        <>
          <WelcomeGate />
          <LocationProbe />
          <Routes>
            <Route path="/feed" element={<p>Feed</p>} />
          </Routes>
        </>
      );
    }

    const view = render(
      <MemoryRouter initialEntries={['/login']}>
        <Harness />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: /Hola de nuevo/ })).not.toBeInTheDocument();

    auth.current.showReturningWelcome = true;
    view.rerender(
      <MemoryRouter initialEntries={['/login']}>
        <Harness />
      </MemoryRouter>,
    );

    const markSeen = vi.spyOn(welcomeStorage, 'markSeen');
    const welcome = screen.getByRole('heading', { name: 'Hola de nuevo, Ana.' });
    expect(welcome.closest('[data-variant="returning-user"]')).toBeTruthy();
    expect(screen.getByText('Estamos acá. 💜')).toBeInTheDocument();
    expect(welcomeStorage.hasSeen('user-a')).toBe(true);
    expect(welcomeStorage.shouldShow('user-a')).toBe(false);

    await waitFor(() => expect(screen.getByText('/feed')).toBeInTheDocument());
    expect(markSeen).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /Hola de nuevo/ })).not.toBeInTheDocument();
    expect(welcomeStorage.hasSeen('user-a')).toBe(true);
  });

  it('holds the welcome until the auth transition finishes', async () => {
    vi.useFakeTimers();
    try {
      armAuthTransition();
      auth.current.status = 'authenticated';
      auth.current.user = person('user-a');
      welcomeStorage.armForNextAuthenticatedUser();
      welcomeStorage.consumeArm('user-a');

      render(
        <MemoryRouter initialEntries={['/login']}>
          <WelcomeGate />
        </MemoryRouter>,
      );

      expect(screen.queryByRole('heading', { name: /Bienvenido a ByYourSide/ })).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      expect(screen.getByRole('heading', { name: /Bienvenido a ByYourSide, Ana/ })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the empty-name fallback when displayName is missing', () => {
    auth.current.status = 'authenticated';
    auth.current.user = { ...person('user-a'), displayName: null };
    auth.current.showReturningWelcome = true;

    render(
      <MemoryRouter>
        <WelcomeGate />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hola de nuevo.' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /ana/i })).not.toBeInTheDocument();
  });
});
