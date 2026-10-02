import { AxiosError } from 'axios';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getConversations: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  getPublicProfile: vi.fn(),
  unblockUser: vi.fn(),
  createReport: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' } }),
}));

vi.mock('../context/ChatNotificationsContext', () => ({
  useChatNotifications: () => ({ refreshUnreadCount: vi.fn() }),
}));

const socket = vi.hoisted(() => {
  let status = 'connected';
  const listeners = new Set<() => void>();
  let onMessage: ((payload: unknown) => void) | null = null;
  return {
    get status() {
      return status;
    },
    setStatus(next: string) {
      status = next;
      listeners.forEach((listener) => listener());
    },
    listeners,
    push(payload: unknown) {
      onMessage?.(payload);
    },
    setHandler(handler: ((payload: unknown) => void) | null) {
      onMessage = handler;
    },
  };
});

vi.mock('../api/socket', () => ({
  subscribeToUserQueue: (_destination: string, handler: (payload: unknown) => void) => {
    socket.setHandler(handler);
    return () => socket.setHandler(null);
  },
  getSocketStatus: () => socket.status,
  subscribeSocketStatus: (listener: () => void) => {
    socket.listeners.add(listener);
    return () => socket.listeners.delete(listener);
  },
}));

vi.mock('../api/chat', () => ({
  getConversations: api.getConversations,
  getMessages: api.getMessages,
  sendMessage: api.sendMessage,
}));

vi.mock('../api/users', () => ({ getPublicProfile: api.getPublicProfile }));
vi.mock('../api/blocks', () => ({ blockUser: vi.fn(), unblockUser: api.unblockUser }));
vi.mock('../api/reports', () => ({ createReport: api.createReport }));

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

describe('leaving a conversation', () => {
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
          <Route path="/messages" element={<p>Lista de conversaciones</p>} />
          <Route path="/help" element={<p>Página de ayuda</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    api.getConversations.mockReset().mockResolvedValue([conversation]);
    api.getMessages.mockReset().mockResolvedValue({ content: [] });
    api.getPublicProfile.mockReset().mockResolvedValue({ blockedByCurrentUser: false, mutedByCurrentUser: false });
    api.sendMessage.mockReset();
  });

  it('sends the chosen goodbye and goes back to the list', async () => {
    api.sendMessage.mockResolvedValue({ id: 'm9' });
    const user = userEvent.setup();
    renderChat();

    await user.click(await screen.findByRole('button', { name: 'Necesito irme' }));
    const dialog = screen.getByRole('dialog', { name: 'Está bien irse' });
    await user.click(screen.getByRole('radio', { name: 'Me tengo que ir por ahora. Gracias por la charla.' }));
    await user.click(screen.getByRole('button', { name: 'Enviar y salir' }));

    expect(api.sendMessage).toHaveBeenCalledWith('chat-1', 'Me tengo que ir por ahora. Gracias por la charla.');
    expect(await screen.findByText('Lista de conversaciones')).toBeInTheDocument();
    expect(dialog).not.toBeInTheDocument();
  });

  it('can leave without sending anything', async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByRole('button', { name: 'Necesito irme' }));
    await user.click(screen.getByRole('button', { name: 'Salir sin enviar' }));
    expect(api.sendMessage).not.toHaveBeenCalled();
    expect(await screen.findByText('Lista de conversaciones')).toBeInTheDocument();
  });

  it('stays and explains if the goodbye cannot be sent', async () => {
    api.sendMessage.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByRole('button', { name: 'Necesito irme' }));
    await user.click(screen.getByRole('button', { name: 'Enviar y salir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Podés salir igual');
    expect(screen.getByRole('dialog', { name: 'Está bien irse' })).toBeInTheDocument();
  });

  it('hides the option when I blocked the person (they cannot receive messages)', async () => {
    api.getPublicProfile.mockResolvedValue({ blockedByCurrentUser: true, mutedByCurrentUser: false });
    renderChat();
    expect(await screen.findByText(/Bloqueaste a Lucía/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Necesito irme' })).not.toBeInTheDocument();
  });

  it('reminds that companions are not professionals, with a way to urgent help', async () => {
    renderChat();
    expect(await screen.findByText(/personas de la comunidad, no profesionales/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'buscá ayuda ahora' })).toHaveAttribute('href', '/help');
  });
});

describe('crisis support in chat', () => {
  const lu = { id: 'u2', username: 'lu', displayName: 'Lucía', avatarUrl: null };
  const conversation = { id: 'chat-1', otherUser: lu, lastMessageContent: null, lastMessageAt: null, unreadCount: 0 };
  const msg = (id: string, sender: typeof lu | { id: string }, content: string) => ({
    id,
    conversationId: 'chat-1',
    sender,
    content,
    read: true,
    createdAt: '2026-10-01T12:00:00Z',
  });

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
    api.getPublicProfile.mockReset().mockResolvedValue({ blockedByCurrentUser: false, mutedByCurrentUser: false });
    api.createReport.mockReset().mockResolvedValue(undefined);
  });

  it('guides the companion when the other person writes something with crisis signals', async () => {
    api.getMessages.mockReset().mockResolvedValue({
      content: [msg('m1', lu, 'hola'), msg('m2', lu, 'la verdad no le encuentro sentido a vivir')],
    });
    const user = userEvent.setup();
    renderChat();

    const guide = await screen.findByRole('region', { name: 'Cómo acompañar a Lucía ahora' });
    expect(guide).toHaveTextContent('Preguntale directamente cómo está');
    expect(guide).toHaveTextContent('135');
    expect(api.createReport).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Avisar al equipo' }));
    expect(screen.getByRole('radio', { name: /riesgo de hacerse daño/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(api.createReport).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: 'USER', targetId: 'u2', reason: 'SELF_HARM_RISK' }),
    );
  });

  it('does not show for my own messages or for everyday talk', async () => {
    api.getMessages.mockReset().mockResolvedValue({
      content: [msg('m1', { id: 'me' }, 'me quiero morir'), msg('m2', lu, 'me muero de risa jaja')],
    });
    renderChat();
    expect(await screen.findByText('me muero de risa jaja')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /Cómo acompañar/ })).not.toBeInTheDocument();
  });

  it('hides the guide after "Entendido"', async () => {
    api.getMessages.mockReset().mockResolvedValue({ content: [msg('m2', lu, 'quiero hacerme daño')] });
    const user = userEvent.setup();
    renderChat();
    await user.click(await screen.findByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('region', { name: /Cómo acompañar/ })).not.toBeInTheDocument();
  });
});

describe('realtime connection', () => {
  const lu = { id: 'u2', username: 'lu', displayName: 'Lucía', avatarUrl: null };
  const conversation = { id: 'chat-1', otherUser: lu, lastMessageContent: null, lastMessageAt: null, unreadCount: 0 };
  const msg = (id: string, content: string, minute: number) => ({
    id,
    conversationId: 'chat-1',
    sender: lu,
    content,
    read: true,
    createdAt: `2026-10-02T12:${String(minute).padStart(2, '0')}:00Z`,
  });

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
    socket.setStatus('connected');
    api.getConversations.mockReset().mockResolvedValue([conversation]);
    api.getPublicProfile.mockReset().mockResolvedValue({ blockedByCurrentUser: false, mutedByCurrentUser: false });
  });

  it('warns while reconnecting and fetches the messages missed during the drop', async () => {
    api.getMessages
      .mockReset()
      .mockResolvedValueOnce({ content: [msg('m1', 'hola', 1)] })
      .mockResolvedValueOnce({ content: [msg('m1', 'hola', 1), msg('m2', 'llegó mientras estabas sin conexión', 2)] });
    renderChat();
    expect(await screen.findByText('hola')).toBeInTheDocument();

    act(() => socket.setStatus('reconnecting'));
    expect(screen.getByText(/Reconectando…/)).toHaveAttribute('role', 'status');

    act(() => socket.setStatus('connected'));
    expect(await screen.findByText('llegó mientras estabas sin conexión')).toBeInTheDocument();
    expect(screen.queryByText(/Reconectando/)).not.toBeInTheDocument();
    expect(screen.getAllByText('hola')).toHaveLength(1);
  });

  it('announces incoming messages in an accessible log, without duplicates', async () => {
    api.getMessages.mockReset().mockResolvedValue({ content: [msg('m1', 'hola', 1)] });
    renderChat();
    const log = await screen.findByRole('log', { name: 'Mensajes con Lucía' });
    expect(log).toHaveTextContent('Lucía: hola');

    act(() => socket.push(msg('m2', '¿cómo seguís?', 2)));
    act(() => socket.push(msg('m2', '¿cómo seguís?', 2)));
    expect(screen.getAllByText('¿cómo seguís?')).toHaveLength(1);
  });

  it('does not show the warning on the first connection', async () => {
    api.getMessages.mockReset().mockResolvedValue({ content: [] });
    socket.setStatus('connecting');
    renderChat();
    await screen.findByRole('log');
    expect(screen.queryByText(/Reconectando/)).not.toBeInTheDocument();
  });
});

describe('switching conversations', () => {
  const lu = { id: 'u2', username: 'lu', displayName: 'Lucía', avatarUrl: null };
  const mati = { id: 'u3', username: 'mati', displayName: 'Mati', avatarUrl: null };
  const conversations = [
    { id: 'chat-1', otherUser: lu, lastMessageContent: null, lastMessageAt: null, unreadCount: 0 },
    { id: 'chat-2', otherUser: mati, lastMessageContent: null, lastMessageAt: null, unreadCount: 0 },
  ];
  const msg = (id: string, conversationId: string, content: string) => ({
    id,
    conversationId,
    sender: conversationId === 'chat-1' ? lu : mati,
    content,
    read: true,
    createdAt: '2026-10-02T12:00:00Z',
  });

  function GoTo({ to }: { to: string }) {
    const navigate = useNavigate();
    return (
      <button type="button" onClick={() => navigate(to)}>
        ir a {to}
      </button>
    );
  }

  it('does not let a late response from the previous chat overwrite the current one', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    api.getConversations.mockReset().mockResolvedValue(conversations);
    api.getPublicProfile.mockReset().mockResolvedValue({ blockedByCurrentUser: false, mutedByCurrentUser: false });
    api.getMessages.mockReset().mockImplementation((id: string) =>
      id === 'chat-1'
        ? new Promise((resolve) => {
            resolveFirst = resolve;
          })
        : Promise.resolve({ content: [msg('m2', 'chat-2', 'mensaje de Mati')] }),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/messages/chat-1']}>
        <GoTo to="/messages/chat-2" />
        <Routes>
          <Route path="/messages/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'ir a /messages/chat-2' }));
    expect(await screen.findByText('mensaje de Mati')).toBeInTheDocument();

    await act(async () => {
      resolveFirst({ content: [msg('m1', 'chat-1', 'mensaje viejo de Lucía')] });
    });
    expect(screen.queryByText('mensaje viejo de Lucía')).not.toBeInTheDocument();
    expect(screen.getByText('mensaje de Mati')).toBeInTheDocument();
  });
});
