import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiscoverUser } from '../api/types';

const api = vi.hoisted(() => ({
  discoverUsers: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

vi.mock('../api/users', () => ({
  discoverUsers: api.discoverUsers,
}));

vi.mock('../api/follows', () => ({
  followUser: api.followUser,
  unfollowUser: api.unfollowUser,
}));

import DiscoverPage from './DiscoverPage';

function person(overrides: Partial<DiscoverUser> = {}): DiscoverUser {
  return {
    id: 'ana-id',
    username: 'ana',
    displayName: 'Ana',
    bio: 'Me gusta escuchar.',
    avatarUrl: null,
    profileVisibility: 'PUBLIC',
    followState: 'NONE',
    ...overrides,
  };
}

function renderDiscover() {
  return render(
    <MemoryRouter initialEntries={['/discover']}>
      <Routes>
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/profile/:userId" element={<p>Perfil</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DiscoverPage', () => {
  beforeEach(() => {
    api.discoverUsers.mockReset();
    api.followUser.mockReset();
    api.unfollowUser.mockReset();
    api.followUser.mockResolvedValue(undefined);
  });

  it('renders identity, username and bio, and opens the profile', async () => {
    api.discoverUsers.mockResolvedValue({ content: [person()], totalElements: 1, totalPages: 1, number: 0, size: 20, last: true });
    const user = userEvent.setup();
    renderDiscover();

    expect(await screen.findByRole('heading', { name: 'Descubrir' })).toBeInTheDocument();
    expect(screen.getByText('Personas con quienes podés conectar, sin apuro.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personas por acá' })).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('Me gusta escuchar.')).toBeInTheDocument();
    expect(screen.queryByText('Podría hacerte bien acompañar.')).not.toBeInTheDocument();
    expect(screen.queryByText(/personas compartiendo/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(api.discoverUsers).toHaveBeenCalledWith(0, 20);

    await user.click(screen.getByRole('link', { name: /Ana/ }));
    expect(await screen.findByText('Perfil')).toBeInTheDocument();
  });

  it('omits a missing bio without a placeholder', async () => {
    api.discoverUsers.mockResolvedValue({
      content: [person({ bio: '   ', profileVisibility: 'PRIVATE' })],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true,
    });
    renderDiscover();

    expect(await screen.findByText('@ana')).toBeInTheDocument();
    expect(screen.queryByText('Me gusta escuchar.')).not.toBeInTheDocument();
    expect(screen.queryByText(/todavía no/i)).not.toBeInTheDocument();
  });

  it('shows a sent request without calling follow again', async () => {
    api.discoverUsers.mockResolvedValue({
      content: [person({ followState: 'REQUESTED' })],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true,
    });
    renderDiscover();

    const requested = await screen.findByRole('button', { name: 'Solicitud enviada' });
    expect(requested).toBeDisabled();
    expect(requested).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(requested);
    expect(api.followUser).not.toHaveBeenCalled();
  });

  it('filters the loaded list and uses a search-specific empty state', async () => {
    api.discoverUsers.mockResolvedValue({
      content: [person(), person({ id: 'luz-id', username: 'luz', displayName: 'Luz', bio: null })],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true,
    });
    const user = userEvent.setup();
    renderDiscover();

    expect(await screen.findByText('Luz')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Buscar personas'), 'luz');
    expect(screen.getByText('Luz')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Buscar personas'));
    await user.type(screen.getByLabelText('Buscar personas'), 'nadie');
    expect(screen.getByText('No encontramos a nadie con ese nombre en esta lista.')).toBeInTheDocument();
    expect(screen.queryByText('Ya acompañás a todo el mundo por acá')).not.toBeInTheDocument();
    expect(screen.queryByText('No hay personas para mostrar por ahora.')).not.toBeInTheDocument();
  });

  it('shows the real empty list without claiming everyone is already accompanied', async () => {
    api.discoverUsers.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true });
    renderDiscover();

    expect(await screen.findByText('No hay personas para mostrar por ahora.')).toBeInTheDocument();
    expect(screen.queryByText('Ya acompañás a todo el mundo por acá')).not.toBeInTheDocument();
  });

  it('shows the load error and can retry', async () => {
    api.discoverUsers.mockRejectedValueOnce(new Error('down'));
    const user = userEvent.setup();
    renderDiscover();

    expect(await screen.findByText('No se pudo cargar la lista de personas.')).toBeInTheDocument();
    api.discoverUsers.mockResolvedValueOnce({
      content: [person()],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true,
    });
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();
  });

  it('shows a loading skeleton before the list arrives', () => {
    api.discoverUsers.mockImplementation(() => new Promise(() => undefined));
    renderDiscover();

    expect(screen.getByRole('status', { name: 'Cargando personas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañar' })).not.toBeInTheDocument();
  });
});
