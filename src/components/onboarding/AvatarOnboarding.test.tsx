import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../api/types';
import { avatarPrompt } from '../../lib/avatarPrompt';
import { guidelinesStorage } from '../../lib/communityGuidelines';

const auth = vi.hoisted(() => ({
  current: {
    user: null as User | null,
    status: 'authenticated' as const,
    showReturningWelcome: false,
    clearReturningWelcome: vi.fn(),
    reloadUser: vi.fn(),
  },
}));
const api = vi.hoisted(() => ({ setAvatar: vi.fn() }));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth.current }));
vi.mock('../../api/users', () => ({ setAvatar: api.setAvatar }));

import { WelcomeGate } from '../auth/WelcomeGate';

const ana: User = {
  id: 'u1',
  username: 'ana',
  email: 'ana@example.com',
  displayName: 'Ana',
  bio: null,
  avatarId: null,
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

describe('avatar onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    auth.current.user = ana;
    auth.current.reloadUser.mockResolvedValue(undefined);
    // Ya vio la bienvenida y aceptó las normas: lo que sigue es el avatar.
    localStorage.setItem('byyourside.welcomeSeen.u1', 'true');
    guidelinesStorage.accept('u1');
  });

  it('offers to choose an avatar once, after the guidelines, and saves the choice', async () => {
    api.setAvatar.mockResolvedValue({ ...ana, avatarId: 'ola' });
    const user = userEvent.setup();
    renderAt();

    expect(screen.getByRole('heading', { name: '¿Cómo querés que te vean?' })).toHaveFocus();
    expect(screen.getByText(/no usamos fotos/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Ola' }));
    await user.click(screen.getByRole('button', { name: 'Elegir este' }));

    expect(api.setAvatar).toHaveBeenCalledWith('ola');
    expect(avatarPrompt.wasAsked('u1')).toBe(true);
    expect(auth.current.reloadUser).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('can be skipped, and does not come back', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt();
    await user.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(api.setAvatar).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    renderAt();
    expect(screen.queryByRole('heading', { name: '¿Cómo querés que te vean?' })).not.toBeInTheDocument();
  });

  it('is not shown to someone who already has an avatar, nor over the help page', () => {
    auth.current.user = { ...ana, avatarId: 'sol' };
    const { unmount } = renderAt();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    auth.current.user = ana;
    renderAt('/help');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
