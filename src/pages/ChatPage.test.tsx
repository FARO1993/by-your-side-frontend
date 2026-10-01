import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getConversations: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  getPublicProfile: vi.fn(),
  unblockUser: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' } }),
}));

vi.mock('../context/ChatNotificationsContext', () => ({
  useChatNotifications: () => ({ refreshUnreadCount: vi.fn() }),
}));

vi.mock('../api/socket', () => ({
  subscribeToUserQueue: () => () => undefined,
}));

vi.mock('../api/chat', () => ({
  getConversations: api.getConversations,
  getMessages: api.getMessages,
  sendMessage: api.sendMessage,
}));

vi.mock('../api/users', () => ({ getPublicProfile: api.getPublicProfile }));
vi.mock('../api/blocks', () => ({ blockUser: vi.fn(), unblockUser: api.unblockUser }));

import ChatPage from './ChatPage';

describe('chat send failures', () => {
  beforeEach(() => {
    api.getConversations.mockReset();
    api.getMessages.mockReset();
    api.sendMessage.mockReset();
    api.getConversations.mockResolvedValue([]);
    api.getMessages.mockResolvedValue({ content: [] });
  });

  it('restores the draft with a generic failure', async () => {
    const denied = new AxiosError('forbidden');
    denied.response = { status: 403, data: {}, statusText: 'Forbidden', headers: {}, config: {} as never };
    api.sendMessage.mockRejectedValue(denied);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/messages/chat-1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const field = screen.getByPlaceholderText('Escribí un mensaje…');
    await user.type(field, 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos enviar el mensaje.');
    expect(field).toHaveValue('hola');
    expect(screen.queryByText(/bloque/i)).not.toBeInTheDocument();
  });
});

describe('chat safety', () => {
  const conversation = {
    id: 'chat-1',
    otherUser: { id: 'u2', username: 'lu', displayName: 'Lucía', avatarUrl: null },
    lastMessageContent: null,
    lastMessageAt: null,
    unreadCount: 0,
  };

  function renderChat() {
    return render(
      <MemoryRouter initialEntries={['/messages/chat-1']}>
        <Routes>
          <Route path="/messages/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    api.getConversations.mockReset().mockResolvedValue([conversation]);
    api.getMessages.mockReset().mockResolvedValue({ content: [] });
    api.getPublicProfile.mockReset();
    api.unblockUser.mockReset().mockResolvedValue(undefined);
  });

  it('replaces the composer when I blocked the other person, and lets me unblock', async () => {
    api.getPublicProfile.mockResolvedValue({ blockedByCurrentUser: true, mutedByCurrentUser: false });
    const user = userEvent.setup();
    renderChat();

    expect(await screen.findByText('Bloqueaste a Lucía. No pueden enviarse mensajes nuevos.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Escribí un mensaje…')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Desbloquear' }));
    expect(api.unblockUser).toHaveBeenCalledWith('u2');
    expect(await screen.findByPlaceholderText('Escribí un mensaje…')).toBeInTheDocument();
  });

  it('does not reveal anything when the profile is not visible (e.g. they blocked me)', async () => {
    api.getPublicProfile.mockRejectedValue(new Error('404'));
    const user = userEvent.setup();
    renderChat();

    await user.click(await screen.findByRole('button', { name: 'Opciones de la conversación con Lucía' }));
    const items = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(items).toEqual(['Ver perfil', 'Reportar']);
    expect(screen.queryByText(/bloque/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribí un mensaje…')).toBeInTheDocument();
  });
});
