import { AxiosError } from 'axios';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getConversations: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
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
