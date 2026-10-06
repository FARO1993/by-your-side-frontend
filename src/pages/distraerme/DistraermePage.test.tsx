import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { GameRoom } from '../../api/gameRooms';
import { GameInvitationsContext } from '../../context/gameInvitationsContext';
import DistraermePage from './DistraermePage';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));

const person = (id: string, name: string) => ({ id, username: name.toLowerCase(), displayName: name, avatarId: null });
const activeRoom: GameRoom = {
  id: 'room-1',
  game: 'MEMORY',
  status: 'ACTIVE',
  endReason: null,
  host: person('me', 'Facu'),
  guest: person('s', 'Soumia'),
  seed: 1,
  eventCount: 0,
  createdAt: '',
  startedAt: '',
  endedAt: null,
  expiresAt: null,
};

function renderPage(path = '/distraerme', openRooms: GameRoom[] = []) {
  render(
    <GameInvitationsContext.Provider value={{ invitations: [], openRooms, refresh: () => {} }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/distraerme" element={<DistraermePage />} />
          <Route path="/distraerme/memoria" element={<p>Juego de memoria</p>} />
          <Route path="/distraerme/invitar" element={<p>Elegir a quién invitar</p>} />
          <Route path="/distraerme/sala/:roomId" element={<p>Sala de juego</p>} />
        </Routes>
      </MemoryRouter>
    </GameInvitationsContext.Provider>,
  );
}

describe('DistraermePage', () => {
  it('asks how before what, with a calm tone', () => {
    renderPage();
    expect(screen.getByText(/Está bien desconectar un rato/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jugar solo\/a/ })).toBeInTheDocument();
    expect(screen.getByText('Invitar a alguien')).toBeInTheDocument();
    expect(screen.queryByText('Memoria')).not.toBeInTheDocument();
  });

  it('then shows the games, all ready to play', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Jugar solo\/a/ }));
    expect(screen.getByRole('button', { name: /Jardín/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Puzzle/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Hojas en el río/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Bloques/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Rebote/ })).toBeEnabled();
    expect(screen.queryByText('Muy pronto')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Memoria/ }));
    expect(screen.getByText('Juego de memoria')).toBeInTheDocument();
  });

  it('lets you invite someone to play together', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Invitar a alguien/ }));
    expect(screen.getByText('Elegir a quién invitar')).toBeInTheDocument();
  });

  it('shows open games to come back to', async () => {
    const user = userEvent.setup();
    renderPage('/distraerme', [activeRoom]);
    await user.click(screen.getByRole('button', { name: 'Seguir jugando Memoria con Soumia' }));
    expect(screen.getByText('Sala de juego')).toBeInTheDocument();
  });
});
