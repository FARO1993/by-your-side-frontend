import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Status, StatusMood } from '../api/types';

const api = vi.hoisted(() => ({
  getFeed: vi.fn(),
  createPost: vi.fn(),
  getStatusFeed: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('../api/posts', () => ({ getFeed: api.getFeed, createPost: api.createPost }));
vi.mock('../api/statuses', () => ({ getStatusFeed: api.getStatusFeed, setStatus: api.setStatus }));
vi.mock('../api/companion', () => ({
  getMyNeed: vi.fn().mockResolvedValue(null),
  getMyOffering: vi.fn().mockResolvedValue(null),
  setNeed: vi.fn(),
  setOffering: vi.fn(),
  cancelNeed: vi.fn(),
  cancelOffering: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', username: 'ana', displayName: 'Ana', avatarId: null } }),
}));

import FeedPage from './FeedPage';

const me = { id: 'me', username: 'ana', displayName: 'Ana', avatarId: null };
const status = (mood: StatusMood, createdAt = new Date().toISOString()): Status => ({
  id: 's1',
  user: me,
  mood,
  createdAt,
  expiresAt: new Date(Date.now() + 3600e3).toISOString(),
  reactionCount: 0,
  reactedByCurrentUser: null,
});

function Where() {
  const location = useLocation();
  return <p>Estás en {location.pathname + location.search}</p>;
}

function renderFeed() {
  render(
    <MemoryRouter initialEntries={['/feed']}>
      <Routes>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FeedPage · respuesta cuidada al ánimo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    api.getFeed.mockResolvedValue({ content: [] });
    api.getStatusFeed.mockResolvedValue([]);
  });

  it('after "Día difícil" offers to breathe right there, company, or letting go — and a quiet way to help', async () => {
    api.setStatus.mockResolvedValue(status('DIFFICULT_DAY'));
    const user = userEvent.setup();
    renderFeed();

    await user.click(await screen.findByRole('button', { name: 'Día difícil' }));
    const card = await screen.findByRole('region', { name: 'Un día difícil pesa' });
    expect(within(card).getByRole('link', { name: 'Buscar compañía' })).toHaveAttribute('href', '/companion');
    expect(within(card).getByRole('link', { name: 'Soltar un pensamiento' })).toHaveAttribute('href', '/distraerme/hojas');
    expect(within(card).getByRole('link', { name: /hay ayuda profesional ahora/ })).toHaveAttribute('href', '/help');

    await user.click(within(card).getByRole('button', { name: 'Respirar un minuto' }));
    expect(within(card).getByRole('button', { name: 'Empezar' })).toBeInTheDocument();
  });

  it('after "Necesito distraerme" offers to play alone or with someone', async () => {
    api.setStatus.mockResolvedValue(status('NEED_DISTRACTION'));
    const user = userEvent.setup();
    renderFeed();

    await user.click(await screen.findByRole('button', { name: 'Necesito distraerme' }));
    const card = await screen.findByRole('region', { name: '¿Querés despejarte un rato?' });
    expect(within(card).queryByText(/ayuda profesional/)).not.toBeInTheDocument();
    await user.click(within(card).getByRole('link', { name: 'Jugar algo tranquilo' }));
    expect(screen.getByText('Estás en /distraerme?jugar=solo')).toBeInTheDocument();
  });

  it('remembers today\'s mood after a reload, but "Ahora no" closes it for the rest of the day', async () => {
    api.getStatusFeed.mockResolvedValue([status('DIFFICULT_DAY')]);
    const user = userEvent.setup();
    renderFeed();

    const card = await screen.findByRole('region', { name: 'Un día difícil pesa' });
    await user.click(within(card).getByRole('button', { name: 'Ahora no' }));
    expect(screen.queryByRole('region', { name: 'Un día difícil pesa' })).not.toBeInTheDocument();
  });

  it('does not bring back a mood from another day', async () => {
    const yesterday = new Date(Date.now() - 36 * 3600e3).toISOString();
    api.getStatusFeed.mockResolvedValue([status('DIFFICULT_DAY', yesterday)]);
    renderFeed();
    await screen.findByRole('button', { name: 'Día difícil' });
    expect(screen.queryByRole('region', { name: 'Un día difícil pesa' })).not.toBeInTheDocument();
  });

  it('stays closed after a reload once dismissed', async () => {
    api.getStatusFeed.mockResolvedValue([status('DIFFICULT_DAY')]);
    const user = userEvent.setup();
    const first = render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>,
    );
    await user.click(within(await screen.findByRole('region', { name: 'Un día difícil pesa' })).getByRole('button', { name: 'Ahora no' }));
    first.unmount();

    renderFeed();
    await screen.findByRole('button', { name: 'Día difícil' });
    expect(screen.queryByRole('region', { name: 'Un día difícil pesa' })).not.toBeInTheDocument();
  });
});
