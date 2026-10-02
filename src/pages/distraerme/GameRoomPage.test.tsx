import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameEvent, GameRoom, GameRoomMessage } from '../../api/gameRooms';
import { initialTogether } from '../../lib/games/memoryTogether';
import GameRoomPage from './GameRoomPage';

const api = vi.hoisted(() => ({
  getGameRoom: vi.fn(),
  getGameEvents: vi.fn(),
  sendGameEvent: vi.fn(),
  acceptGameRoom: vi.fn(),
  declineGameRoom: vi.fn(),
  leaveGameRoom: vi.fn(),
}));
const socket = vi.hoisted(() => ({ handler: null as null | ((message: GameRoomMessage) => void) }));
const me = vi.hoisted(() => ({ id: 'host-id' }));

vi.mock('../../api/gameRooms', async (importOriginal) => ({ ...(await importOriginal<object>()), ...api }));
vi.mock('../../api/socket', () => ({
  subscribeToUserQueue: (_: string, handler: (message: GameRoomMessage) => void) => {
    socket.handler = handler;
    return () => {};
  },
  getSocketStatus: () => 'connected',
  subscribeSocketStatus: () => () => {},
}));
vi.mock('../../api/chat', () => ({ getOrCreateConversation: vi.fn().mockResolvedValue({ id: 'conv-1' }) }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: me.id } }) }));

const facu = { id: 'host-id', username: 'facu', displayName: 'Facu', avatarUrl: null };
const soumia = { id: 'guest-id', username: 'soumia', displayName: 'Soumia', avatarUrl: null };
const SEED = 99;

function room(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    id: 'room-1',
    game: 'MEMORY',
    status: 'ACTIVE',
    endReason: null,
    host: facu,
    guest: soumia,
    seed: SEED,
    eventCount: 0,
    createdAt: '',
    startedAt: '2026-10-02T18:00:00Z',
    endedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

const ev = (seq: number, actorId: string, index: number): GameEvent => ({
  roomId: 'room-1',
  seq,
  actorId,
  type: 'FLIP',
  payload: { index },
  createdAt: '',
});

function renderRoom() {
  render(
    <MemoryRouter initialEntries={['/distraerme/sala/room-1']}>
      <Routes>
        <Route path="/distraerme/sala/:roomId" element={<GameRoomPage />} />
        <Route path="/distraerme" element={<p>Hub de Distraerme</p>} />
        <Route path="/messages/:id" element={<p>Charla abierta</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GameRoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    me.id = 'host-id';
    api.getGameEvents.mockResolvedValue([]);
  });

  it('shows the host a calm waiting screen with a way to cancel', async () => {
    api.getGameRoom.mockResolvedValue(room({ status: 'INVITED', startedAt: null }));
    api.leaveGameRoom.mockResolvedValue(room({ status: 'ENDED', endReason: 'CANCELLED' }));
    renderRoom();
    expect(await screen.findByText('Esperando a Soumia…')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar invitación' }));
    expect(await screen.findByText('Hub de Distraerme')).toBeInTheDocument();
  });

  it('lets the guest accept and starts the shared board', async () => {
    me.id = 'guest-id';
    api.getGameRoom.mockResolvedValue(room({ status: 'INVITED', startedAt: null }));
    api.acceptGameRoom.mockResolvedValue(room());
    renderRoom();
    expect(await screen.findByText('Facu te invitó a jugar Memoria')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Jugar' }));
    expect(await screen.findByText('Le toca a Facu.', { selector: 'p:not([role])' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tablero compartido' })).toBeInTheDocument();
  });

  it('sends a flip on your turn and follows the other person’s moves in real time', async () => {
    api.getGameRoom.mockResolvedValue(room());
    api.sendGameEvent.mockImplementation(async (_room: string, type: string, payload: { index: number }) => ({
      ...ev(1, 'host-id', payload.index),
      type,
    }));
    renderRoom();
    expect(await screen.findByText('Te toca: da vuelta dos cartas.', { selector: 'p:not([role])' })).toBeInTheDocument();

    const { game } = initialTogether(SEED);
    const first = game.cards[0].symbol;
    const notPair = game.cards.findIndex((card) => card.symbol !== first);

    fireEvent.click(screen.getByRole('button', { name: 'Carta 1, boca abajo' }));
    expect(api.sendGameEvent).toHaveBeenCalledWith('room-1', 'FLIP', { index: 0 });
    await screen.findByRole('button', { name: /^Carta 1: / });

    // La segunda carta la "da vuelta" el servidor por WebSocket (eco de la jugada).
    act(() => socket.handler?.({ kind: 'EVENT', room: null, event: ev(2, 'host-id', notPair) }));
    expect(await screen.findByText('Le toca a Soumia.', { selector: 'p:not([role])' })).toBeInTheDocument();

    // Fuera de turno no se manda nada.
    api.sendGameEvent.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /^Carta 3/ }));
    expect(api.sendGameEvent).not.toHaveBeenCalled();
  });

  it('tells you gently when the other person leaves', async () => {
    api.getGameRoom.mockResolvedValue(room());
    renderRoom();
    await screen.findByRole('group', { name: 'Tablero compartido' });
    act(() => socket.handler?.({ kind: 'ROOM', room: room({ status: 'ENDED', endReason: 'LEFT' }), event: null }));
    expect(screen.getByText('Soumia salió de la partida. Gracias por este rato juntos.')).toBeInTheDocument();
  });

  it('can always leave, and can open the chat with the other person', async () => {
    api.getGameRoom.mockResolvedValue(room());
    api.leaveGameRoom.mockResolvedValue(room({ status: 'ENDED', endReason: 'LEFT' }));
    renderRoom();
    fireEvent.click(await screen.findByRole('button', { name: /Charla/ }));
    expect(await screen.findByText('Charla abierta')).toBeInTheDocument();
  });

  it('leaving takes you back to the hub', async () => {
    api.getGameRoom.mockResolvedValue(room());
    api.leaveGameRoom.mockResolvedValue(room({ status: 'ENDED', endReason: 'LEFT' }));
    renderRoom();
    fireEvent.click(await screen.findByRole('button', { name: /Salir/ }));
    expect(await screen.findByText('Hub de Distraerme')).toBeInTheDocument();
    expect(api.leaveGameRoom).toHaveBeenCalledWith('room-1');
  });

  it('says so when the room does not exist', async () => {
    api.getGameRoom.mockRejectedValue(new Error('nope'));
    renderRoom();
    expect(await screen.findByText(/No pudimos abrir la partida/)).toBeInTheDocument();
  });
});
