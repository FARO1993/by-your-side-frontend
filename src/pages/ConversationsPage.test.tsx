import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ getConversations: vi.fn() }));
vi.mock('../api/chat', () => ({ getConversations: api.getConversations }));
vi.mock('../components/byourside/messages-chrome', () => ({
  MessagesChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ConversationList: ({ conversations }: { conversations: { id: string; otherUser: { username: string } }[] }) => (
    <ul>
      {conversations.map((conversation) => (
        <li key={conversation.id}>{conversation.otherUser.username}</li>
      ))}
    </ul>
  ),
}));

import ConversationsPage from './ConversationsPage';

function renderPage() {
  render(
    <MemoryRouter>
      <ConversationsPage />
    </MemoryRouter>,
  );
}

describe('ConversationsPage', () => {
  beforeEach(() => {
    api.getConversations.mockReset();
  });

  it('shows a skeleton while loading', () => {
    api.getConversations.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: 'Cargando conversaciones' })).toBeInTheDocument();
  });

  it('does not claim there are no conversations when loading fails, and lets you retry', async () => {
    api.getConversations
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 'c1', otherUser: { username: 'lu' } }]);
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('No pudimos traer tus conversaciones. Probá de nuevo.')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no tenés conversaciones')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('lu')).toBeInTheDocument();
  });

  it('shows the empty state only when there really are none', async () => {
    api.getConversations.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('Todavía no tenés conversaciones')).toBeInTheDocument();
  });
});
