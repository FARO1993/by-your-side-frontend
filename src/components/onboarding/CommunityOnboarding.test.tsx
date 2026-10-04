import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../api/types';
import { welcomeStorage } from '../../auth/welcomeStorage';
import { COMMUNITY_GUIDELINES, guidelinesStorage } from '../../lib/communityGuidelines';

const auth = vi.hoisted(() => ({
  current: {
    user: null as User | null,
    status: 'authenticated' as 'initializing' | 'authenticated' | 'unauthenticated',
    showReturningWelcome: false,
    clearReturningWelcome: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth.current }));

import { WelcomeGate } from '../auth/WelcomeGate';

const ana: User = {
  id: 'u1',
  username: 'ana',
  email: 'ana@example.com',
  displayName: 'Ana',
  bio: null,
  // Ya tiene avatar: acá solo se prueban las normas (el paso del avatar tiene sus tests).
  avatarId: 'hoja',
  role: 'USER',
  createdAt: '2026-09-25T00:00:00Z',
  emailVerified: true,
  emailVerifiedAt: null,
};

function renderAt(path = '/feed') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WelcomeGate />
    </MemoryRouter>,
  );
}

describe('community onboarding', () => {
  beforeEach(() => {
    auth.current.user = ana;
    auth.current.status = 'authenticated';
    auth.current.showReturningWelcome = false;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: String(query).includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('walks through what it is, the guidelines and the care tools, then remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt();

    expect(screen.getByRole('heading', { name: 'Qué es ByYourSide' })).toHaveFocus();
    expect(screen.getByText(/no profesionales/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver líneas de ayuda' })).toHaveAttribute('href', '/help');

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading', { name: 'Cómo nos cuidamos acá' })).toHaveFocus();
    for (const guideline of COMMUNITY_GUIDELINES) {
      expect(screen.getByText(guideline.title)).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(screen.getByRole('heading', { name: 'Qué es ByYourSide' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading', { name: 'Herramientas para cuidarte' })).toBeInTheDocument();
    expect(screen.getByText('Necesito irme')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Me sumo con cuidado' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(guidelinesStorage.hasAccepted('u1')).toBe(true);

    unmount();
    renderAt();
    expect(screen.queryByRole('heading', { name: 'Qué es ByYourSide' })).not.toBeInTheDocument();
  });

  it('never covers the help page or the guidelines page', () => {
    renderAt('/help');
    expect(screen.queryByRole('heading', { name: 'Qué es ByYourSide' })).not.toBeInTheDocument();
  });

  it('waits until the animated welcome is done', () => {
    welcomeStorage.armForNextAuthenticatedUser();
    welcomeStorage.consumeArm('u1');
    renderAt();
    expect(screen.queryByRole('heading', { name: 'Qué es ByYourSide' })).not.toBeInTheDocument();
  });

  it('does not show for someone who already accepted this version', () => {
    guidelinesStorage.accept('u1');
    renderAt();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is shown per person on a shared device', () => {
    guidelinesStorage.accept('someone-else');
    renderAt();
    expect(screen.getByRole('heading', { name: 'Qué es ByYourSide' })).toBeInTheDocument();
  });
});
