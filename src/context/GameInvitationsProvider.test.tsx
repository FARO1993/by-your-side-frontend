import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameRoom, GameRoomMessage } from '../api/gameRooms';
import { GameInvitationsProvider } from './GameInvitationsProvider';

const api = vi.hoisted(() => ({
  getOpenGameRooms: vi.fn(),
  acceptGameRoom: vi.fn(),
  declineGameRoom: vi.fn(),
}));
const socket = vi.hoisted(() => ({ handler: null as null | ((message: GameRoomMessage) => void) }));

vi.mock('../api/gameRooms', async (importOriginal) => ({ ...(await importOriginal<object>()), ...api }));
vi.mock('../api/socket', () => ({
  subscribeToUserQueue: (_: string, handler: (message: GameRoomMessage) => void) => {
    socket.handler = handler;
    return () => {};
  },
}));
vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));

const facu = { id: 'f', username: 'facu', displayName: 'Facu', avatarId: null };
const me = { id: 'me', username: 'yo', displayName: 'Yo', avatarId: null };
const invitation: GameRoom = {
  id: 'room-1',
  game: 'MEMORY',
  status: 'INVITED',
  endReason: null,
  host: facu,
  guest: me,
  seed: 1,
  eventCount: 0,
  createdAt: '',
  startedAt: null,
  endedAt: null,
  expiresAt: '',
};

function renderProvider() {
  render(
    <MemoryRouter initialEntries={['/feed']}>
      <GameInvitationsProvider>
        <Routes>
          <Route path="/feed" element={<p>Inicio</p>} />
          <Route path="/distraerme/sala/:roomId" element={<p>Sala de juego</p>} />
        </Routes>
      </GameInvitationsProvider>
    </MemoryRouter>,
  );
}

describe('GameInvitationsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getOpenGameRooms.mockResolvedValue([]);
  });

  it('shows a gentle card when someone invites you, and Jugar takes you to the game', async () => {
    api.acceptGameRoom.mockResolvedValue({ ...invitation, status: 'ACTIVE' });
    renderProvider();
    await waitFor(() => expect(api.getOpenGameRooms).toHaveBeenCalled());
    act(() => socket.handler?.({ kind: 'INVITATION', room: invitation, event: null }));

    expect(screen.getByRole('region', { name: 'Invitación a jugar' })).toHaveTextContent('Facu te invitó a jugar Memoria.');
    fireEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    await screen.findByText('Sala de juego');
    expect(api.acceptGameRoom).toHaveBeenCalledWith('room-1');
  });

  it('Ahora no declines without any reason and the card goes away', async () => {
    api.getOpenGameRooms.mockResolvedValue([invitation]);
    api.declineGameRoom.mockResolvedValue({ ...invitation, status: 'ENDED', endReason: 'DECLINED' });
    renderProvider();
    fireEvent.click(await screen.findByRole('button', { name: 'Ahora no' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Invitación a jugar' })).not.toBeInTheDocument());
    expect(api.declineGameRoom).toHaveBeenCalledWith('room-1');
  });

  it('hides the card when the invitation is cancelled or expires', async () => {
    api.getOpenGameRooms.mockResolvedValue([invitation]);
    renderProvider();
    await screen.findByRole('button', { name: 'Jugar' });
    act(() => socket.handler?.({ kind: 'ROOM', room: { ...invitation, status: 'ENDED', endReason: 'CANCELLED' }, event: null }));
    expect(screen.queryByRole('button', { name: 'Jugar' })).not.toBeInTheDocument();
  });

  it('tells you kindly when the invitation is no longer there', async () => {
    api.getOpenGameRooms.mockResolvedValueOnce([invitation]).mockResolvedValue([]);
    api.acceptGameRoom.mockRejectedValue(new Error('409'));
    renderProvider();
    fireEvent.click(await screen.findByRole('button', { name: 'Jugar' }));
    expect(await screen.findByText('Esa invitación ya no está disponible.')).toBeInTheDocument();
  });
});
