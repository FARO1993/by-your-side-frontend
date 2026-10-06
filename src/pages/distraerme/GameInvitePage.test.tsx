import { fireEvent, render, screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameInvitePage from './GameInvitePage';

const mocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
  getFollowing: vi.fn(),
  inviteToGame: vi.fn(),
}));
vi.mock('../../api/chat', () => ({ getConversations: mocks.getConversations }));
vi.mock('../../api/follows', () => ({ getFollowing: mocks.getFollowing }));
vi.mock('../../api/gameRooms', () => ({ inviteToGame: mocks.inviteToGame }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));

const soumia = { id: 's', username: 'soumia', displayName: 'Soumia', avatarId: null };
const lu = { id: 'l', username: 'lu', displayName: 'Lu', avatarId: null };

function renderPage(path = '/distraerme/invitar') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/distraerme/invitar" element={<GameInvitePage />} />
        <Route path="/distraerme/sala/:roomId" element={<p>Sala de juego</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function forbidden(status = 403) {
  return new AxiosError('forbidden', String(status), undefined, undefined, {
    status,
    statusText: 'Forbidden',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message: 'You can only invite people you already know' },
  });
}

describe('GameInvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConversations.mockResolvedValue([{ id: 'c1', otherUser: lu, lastMessageContent: null, lastMessageAt: null, unreadCount: 0 }]);
    mocks.getFollowing.mockResolvedValue([soumia, lu]);
  });

  it('lists the people you know once each, and only together-ready games can be picked', async () => {
    renderPage();
    expect(await screen.findByText('Soumia')).toBeInTheDocument();
    expect(screen.getAllByText('Lu')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /^Memoria/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Puzzle/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^Jardín/ })).toBeEnabled();
    expect(mocks.getFollowing).toHaveBeenCalledWith('me');
  });

  it('sends the invitation and opens the room', async () => {
    mocks.inviteToGame.mockResolvedValue({ id: 'room-9' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Invitar a Soumia a jugar Memoria' }));
    expect(await screen.findByText('Sala de juego')).toBeInTheDocument();
    expect(mocks.inviteToGame).toHaveBeenCalledWith('s', 'MEMORY');
  });

  it('explains who can be invited when the backend says no', async () => {
    mocks.inviteToGame.mockRejectedValue(forbidden());
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Invitar a Lu a jugar Memoria' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Por ahora podés invitar a quienes seguís');
  });

  it('asks to wait when there are already many invitations pending', async () => {
    mocks.inviteToGame.mockRejectedValue(forbidden(429));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Invitar a Lu a jugar Memoria' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya tenés varias invitaciones esperando respuesta');
  });

  it('filters by name and puts the preselected person first', async () => {
    renderPage('/distraerme/invitar?con=l');
    const buttons = await screen.findAllByRole('button', { name: /^Invitar a / });
    expect(buttons[0]).toHaveAccessibleName('Invitar a Lu a jugar Memoria');
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre'), { target: { value: 'sou' } });
    expect(screen.getAllByRole('button', { name: /^Invitar a / })).toHaveLength(1);
  });
});
