import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Notification } from '../api/types';

const api = vi.hoisted(() => ({
  getUnreadCount: vi.fn(),
}));

const socket = vi.hoisted(() => ({
  onMessage: null as null | ((notification: Notification) => void),
}));

vi.mock('../api/notifications', () => ({
  getUnreadCount: api.getUnreadCount,
}));

vi.mock('../api/socket', () => ({
  subscribeToUserQueue: (_destination: string, onMessage: (notification: Notification) => void) => {
    socket.onMessage = onMessage;
    return () => {
      socket.onMessage = null;
    };
  },
}));

import { useNotificationUnread } from '../context/notificationUnreadContext';
import { NotificationUnreadProvider } from '../context/NotificationUnreadProvider';

function Probe() {
  const { notificationUnread, setNotificationUnread, subscribe } = useNotificationUnread();
  const [latest, setLatest] = useState('');

  useEffect(() => subscribe((notification) => setLatest(notification.actor.displayName ?? '')), [subscribe]);

  return (
    <div>
      <p>count:{notificationUnread}</p>
      <p>latest:{latest}</p>
      <button type="button" onClick={() => setNotificationUnread(0)}>
        Limpiar
      </button>
    </div>
  );
}

const incoming: Notification = {
  id: 'live',
  actor: { id: 'ana', username: 'ana', displayName: 'Ana', avatarUrl: null },
  type: 'NEW_FOLLOWER',
  postId: null,
  read: false,
  createdAt: new Date().toISOString(),
};

describe('useNotificationUnread', () => {
  beforeEach(() => {
    api.getUnreadCount.mockReset();
    api.getUnreadCount.mockResolvedValue(2);
    socket.onMessage = null;
  });

  it('loads the unread count, increments it from the socket, and can be replaced after mark all', async () => {
    const user = userEvent.setup();
    render(
      <NotificationUnreadProvider>
        <Probe />
      </NotificationUnreadProvider>,
    );

    expect(await screen.findByText('count:2')).toBeInTheDocument();

    act(() => {
      socket.onMessage?.(incoming);
    });

    expect(screen.getByText('count:3')).toBeInTheDocument();
    expect(screen.getByText('latest:Ana')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByText('count:0')).toBeInTheDocument();
  });
});
