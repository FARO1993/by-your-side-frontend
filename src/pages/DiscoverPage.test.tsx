import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiscoverUser, Page } from '../api/types';

const api = vi.hoisted(() => ({
  discoverUsers: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getUserStatus: vi.fn(),
}));

vi.mock('../api/users', () => ({
  DISCOVER_PAGE_SIZE: 20,
  discoverUsers: api.discoverUsers,
}));

vi.mock('../api/follows', () => ({
  followUser: api.followUser,
  unfollowUser: api.unfollowUser,
}));

vi.mock('../api/statuses', () => ({
  getUserStatus: api.getUserStatus,
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
    available: false,
    statusMood: null,
    ...overrides,
  };
}

function result(content: DiscoverUser[], overrides: Partial<Page<DiscoverUser>> = {}): Page<DiscoverUser> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 20,
    last: true,
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
    api.getUserStatus.mockReset();
    api.followUser.mockResolvedValue({
      followerId: 'me',
      followingId: 'ana-id',
      createdAt: '2026-09-20T12:00:00.000Z',
      followState: 'FOLLOWING',
      requestId: null,
    });
    vi.useRealTimers();
  });

  it('renders browse results and opens the profile', async () => {
    api.discoverUsers.mockResolvedValue(result([person()]));
    const user = userEvent.setup();
    renderDiscover();

    expect(await screen.findByRole('heading', { name: 'Descubrir' })).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('Me gusta escuchar.')).toBeInTheDocument();
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(api.discoverUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 20 }));
    expect(api.discoverUsers.mock.calls[0][0].q).toBeUndefined();

    await user.click(screen.getByRole('link', { name: /Ana/ }));
    expect(await screen.findByText('Perfil')).toBeInTheDocument();
  });

  it('shows the status mood from the discover payload', async () => {
    api.discoverUsers.mockResolvedValue(result([person({ statusMood: 'DIFFICULT_DAY' })]));
    renderDiscover();

    expect(await screen.findByText('Día difícil')).toBeInTheDocument();
    expect(screen.queryByText('DIFFICULT_DAY')).not.toBeInTheDocument();
    expect(api.getUserStatus).not.toHaveBeenCalled();
  });

  it('hides the mood when statusMood is null', async () => {
    api.discoverUsers.mockResolvedValue(result([person({ statusMood: null })]));
    renderDiscover();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText('Estoy bien')).not.toBeInTheDocument();
    expect(screen.queryByText('Día difícil')).not.toBeInTheDocument();
    expect(screen.queryByText('Necesito distraerme')).not.toBeInTheDocument();
    expect(screen.queryByText('Necesito hablar')).not.toBeInTheDocument();
    expect(screen.queryByText('Estoy acá para alguien')).not.toBeInTheDocument();
    expect(screen.queryByText(/sin estado|no tiene estado/i)).not.toBeInTheDocument();
  });

  it('shows availability and mood as independent signals', async () => {
    api.discoverUsers.mockResolvedValue(
      result([
        person({ available: true, statusMood: 'DIFFICULT_DAY' }),
        person({ id: 'luz-id', username: 'luz', displayName: 'Luz', bio: null, available: false, statusMood: 'WELL' }),
        person({ id: 'sol-id', username: 'sol', displayName: 'Sol', bio: null, available: true, statusMood: null }),
      ]),
    );
    renderDiscover();

    expect(await screen.findByText('Día difícil')).toBeInTheDocument();
    expect(screen.getByText('Estoy bien')).toBeInTheDocument();
    expect(screen.getAllByText('Disponible ahora')).toHaveLength(2);
    const sol = screen.getByRole('link', { name: /Sol/ });
    expect(sol).toHaveTextContent('Disponible ahora');
    expect(sol).not.toHaveTextContent('Estoy bien');
    expect(sol).not.toHaveTextContent('Día difícil');
  });

  it('maps every status mood to the existing copy', async () => {
    api.discoverUsers.mockResolvedValue(
      result([
        person({ statusMood: 'WELL' }),
        person({ id: 'b', username: 'b', displayName: 'Bea', bio: null, statusMood: 'NEED_DISTRACTION' }),
        person({ id: 'c', username: 'c', displayName: 'Ciro', bio: null, statusMood: 'DIFFICULT_DAY' }),
        person({ id: 'd', username: 'd', displayName: 'Dani', bio: null, statusMood: 'NEED_TO_TALK' }),
        person({ id: 'e', username: 'e', displayName: 'Eva', bio: null, statusMood: 'HERE_FOR_SOMEONE' }),
      ]),
    );
    renderDiscover();

    expect(await screen.findByText('Estoy bien')).toBeInTheDocument();
    expect(screen.getByText('Necesito distraerme')).toBeInTheDocument();
    expect(screen.getByText('Día difícil')).toBeInTheDocument();
    expect(screen.getByText('Necesito hablar')).toBeInTheDocument();
    expect(screen.getByText('Estoy acá para alguien')).toBeInTheDocument();
  });

  it('does not show a mood for a private profile when statusMood is null', async () => {
    api.discoverUsers.mockResolvedValue(
      result([person({ profileVisibility: 'PRIVATE', bio: null, statusMood: null })]),
    );
    renderDiscover();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.queryByText(/estoy bien|día difícil|necesito|estoy acá/i)).not.toBeInTheDocument();
  });

  it('shows the mood for someone you already accompany', async () => {
    api.discoverUsers.mockResolvedValue(
      result([person({ followState: 'FOLLOWING', statusMood: 'HERE_FOR_SOMEONE' })]),
    );
    renderDiscover();

    expect(await screen.findByText('Estoy acá para alguien')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompañás' })).toBeInTheDocument();
  });

  it('shows the mood while a follow request is pending', async () => {
    api.discoverUsers.mockResolvedValue(
      result([person({ followState: 'REQUESTED', statusMood: 'NEED_TO_TALK' })]),
    );
    renderDiscover();

    expect(await screen.findByText('Necesito hablar')).toBeInTheDocument();
    expect(screen.getByText('Solicitud enviada')).toBeInTheDocument();
  });

  it('shows a discreet availability signal only when the person is available', async () => {
    api.discoverUsers.mockResolvedValue(
      result([
        person({ available: true }),
        person({ id: 'luz-id', username: 'luz', displayName: 'Luz', bio: null, available: false }),
      ]),
    );
    renderDiscover();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getAllByText('Disponible ahora')).toHaveLength(1);
    expect(screen.queryByText(/puede escuchar/i)).not.toBeInTheDocument();
  });

  it('keeps a private bio hidden while showing availability', async () => {
    api.discoverUsers.mockResolvedValue(
      result([person({ bio: null, profileVisibility: 'PRIVATE', available: true })]),
    );
    renderDiscover();

    expect(await screen.findByText('Disponible ahora')).toBeInTheDocument();
    expect(screen.queryByText('Me gusta escuchar.')).not.toBeInTheDocument();
  });

  it('shows request, follow and following states', async () => {
    api.discoverUsers.mockResolvedValue(
      result([
        person({ followState: 'NONE' }),
        person({ id: 'req-id', username: 'sol', displayName: 'Sol', bio: null, followState: 'REQUESTED' }),
        person({ id: 'fol-id', username: 'luz', displayName: 'Luz', bio: null, followState: 'FOLLOWING' }),
      ]),
    );
    renderDiscover();

    expect(await screen.findByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(screen.getByText('Solicitud enviada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar solicitud' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Acompañás' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('turns a private follow into a sent request', async () => {
    api.discoverUsers.mockResolvedValue(result([person({ profileVisibility: 'PRIVATE' })]));
    api.followUser.mockResolvedValueOnce({
      followerId: 'me',
      followingId: 'ana-id',
      createdAt: '2026-09-20T12:00:00.000Z',
      followState: 'REQUESTED',
      requestId: 'request-1',
    });
    const user = userEvent.setup();
    renderDiscover();

    await user.click(await screen.findByRole('button', { name: 'Acompañar' }));
    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar solicitud' })).toBeEnabled();
  });

  it('keeps the follow button when the request fails', async () => {
    api.discoverUsers.mockResolvedValue(result([person()]));
    api.followUser.mockRejectedValueOnce(new Error('down'));
    const user = userEvent.setup();
    renderDiscover();

    await user.click(await screen.findByRole('button', { name: 'Acompañar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos hacerlo ahora. Probá de nuevo en un momento.');
    expect(screen.getByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
  });

  it('searches on the server, replaces results, and returns to browse when cleared', async () => {
    api.discoverUsers.mockResolvedValue(result([person()]));
    renderDiscover();
    expect(await screen.findByText('Ana')).toBeInTheDocument();

    api.discoverUsers.mockResolvedValue(
      result([person({ id: 'luz-id', username: 'luz', displayName: 'Luz', bio: null, statusMood: 'WELL' })]),
    );
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText('Buscar personas'), { target: { value: 'luz' } });
    expect(api.discoverUsers).not.toHaveBeenCalledWith(expect.objectContaining({ q: 'luz' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByText('Luz')).toBeInTheDocument();
    expect(screen.getByText('Estoy bien')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    expect(api.discoverUsers).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'luz', page: 0, size: 20 }));

    api.discoverUsers.mockResolvedValue(result([]));
    fireEvent.change(screen.getByLabelText('Buscar personas'), { target: { value: 'nadie' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText('No encontramos personas con esa búsqueda.')).toBeInTheDocument();

    api.discoverUsers.mockResolvedValue(result([person({ statusMood: 'DIFFICULT_DAY' })]));
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Día difícil')).toBeInTheDocument();
    expect(screen.queryByText('Estoy bien')).not.toBeInTheDocument();
    expect(api.discoverUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, size: 20 }));
    expect(api.discoverUsers.mock.calls.at(-1)?.[0].q).toBeUndefined();
    vi.useRealTimers();
  });

  it('ignores a stale search response', async () => {
    let resolveFirst: (value: Page<DiscoverUser>) => void = () => undefined;
    api.discoverUsers.mockImplementation((options: { q?: string }) => {
      if (options.q === 'fa') return new Promise<Page<DiscoverUser>>((resolve) => { resolveFirst = resolve; });
      if (options.q === 'fac') {
        return Promise.resolve(result([person({ id: 'fac-id', username: 'facu', displayName: 'Facu', bio: null, statusMood: 'WELL' })]));
      }
      return Promise.resolve(result([person()]));
    });
    renderDiscover();
    expect(await screen.findByText('Ana')).toBeInTheDocument();

    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText('Buscar personas'), { target: { value: 'fa' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    fireEvent.change(screen.getByLabelText('Buscar personas'), { target: { value: 'fac' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText('Facu')).toBeInTheDocument();
    expect(screen.getByText('Estoy bien')).toBeInTheDocument();

    resolveFirst(result([person({ id: 'old-id', username: 'fabi', displayName: 'Fabi', bio: null, statusMood: 'DIFFICULT_DAY' })]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText('Fabi')).not.toBeInTheDocument();
    expect(screen.queryByText('Día difícil')).not.toBeInTheDocument();
    expect(screen.getByText('Facu')).toBeInTheDocument();
    expect(screen.getByText('Estoy bien')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('loads the next page without duplicates and hides the button on the last page', async () => {
    api.discoverUsers
      .mockResolvedValueOnce(result([person()], { last: false, totalPages: 2, totalElements: 2 }))
      .mockResolvedValueOnce(result([
        person(),
        person({ id: 'luz-id', username: 'luz', displayName: 'Luz', bio: null, statusMood: 'NEED_DISTRACTION' }),
      ], { number: 1, last: true, totalPages: 2, totalElements: 2 }));
    const user = userEvent.setup();
    renderDiscover();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cargar más' }));
    expect(await screen.findByText('Luz')).toBeInTheDocument();
    expect(screen.getByText('Necesito distraerme')).toBeInTheDocument();
    expect(screen.getAllByText('Ana')).toHaveLength(1);
    expect(api.discoverUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 20 }));
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
  });

  it('keeps loaded people when the next page fails', async () => {
    api.discoverUsers.mockResolvedValueOnce(result([person()], { last: false })).mockRejectedValueOnce(new Error('down'));
    const user = userEvent.setup();
    renderDiscover();

    await user.click(await screen.findByRole('button', { name: 'Cargar más' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar más personas.');
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar más' })).toBeEnabled();
  });

  it('shows an empty browse state', async () => {
    api.discoverUsers.mockResolvedValue(result([]));
    renderDiscover();

    expect(await screen.findByText('Todavía no encontramos más personas para mostrarte.')).toBeInTheDocument();
  });

  it('shows the load error and can retry', async () => {
    api.discoverUsers.mockRejectedValueOnce(new Error('down'));
    const user = userEvent.setup();
    renderDiscover();

    expect(await screen.findByText('No pudimos traer personas para mostrarte. Probá de nuevo.')).toBeInTheDocument();
    api.discoverUsers.mockResolvedValueOnce(result([person()]));
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();
  });

  it('shows a specific message for an invalid search', async () => {
    api.discoverUsers.mockResolvedValue(result([person()]));
    renderDiscover();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    const error = new AxiosError('bad');
    error.response = { status: 400, data: {}, statusText: 'Bad Request', headers: {}, config: {} as never };
    api.discoverUsers.mockRejectedValueOnce(error);
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText('Buscar personas'), { target: { value: '%%%' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText('Esa búsqueda no es válida.')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows a loading skeleton before the list arrives', () => {
    api.discoverUsers.mockImplementation(() => new Promise(() => undefined));
    renderDiscover();

    expect(screen.getByRole('status', { name: 'Cargando personas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañar' })).not.toBeInTheDocument();
  });

  it('resets to the first page when the query changes', async () => {
    api.discoverUsers.mockResolvedValue(result([person()], { last: false }));
    renderDiscover();
    await screen.findByRole('button', { name: 'Cargar más' });
    api.discoverUsers.mockResolvedValue(result([person({ id: 'luz-id', username: 'luz', displayName: 'Luz', bio: null })]));
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText('Buscar personas'), { target: { value: 'luz' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(api.discoverUsers).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'luz', page: 0 }));
    vi.useRealTimers();
  });
});
