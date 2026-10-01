import { act, render, screen, waitFor } from '@testing-library/react';
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
  const { notificationUnread, setNotificationUnread, subscribe, remember } = useNotificationUnread();
  const [latest, setLatest] = useState('');
  const [deliveries, setDeliveries] = useState(0);

  useEffect(
    () =>
      subscribe((notification) => {
        setLatest(notification.actor.displayName ?? '');
        setDeliveries((count) => count + 1);
      }),
    [subscribe],
  );

  return (
    <div>
      <p>count:{notificationUnread}</p>
      <p>latest:{latest}</p>
      <p>deliveries:{deliveries}</p>
      <button type="button" onClick={() => setNotificationUnread(0)}>
        Limpiar
      </button>
      <button type="button" onClick={() => remember(['known'])}>
        Recordar
      </button>
    </div>
  );
}

const incoming: Notification = {
  id: 'live',
  actor: { id: 'ana', username: 'ana', displayName: 'Ana', avatarUrl: null },
  type: 'NEW_FOLLOWER',
  postId: null,
  statusId: null,
  followRequestId: null,
  read: false,
  createdAt: new Date().toISOString(),
};

function renderInbox() {
  render(
    <NotificationUnreadProvider>
      <Probe />
    </NotificationUnreadProvider>,
  );
}

describe('useNotificationUnread', () => {
  beforeEach(() => {
    api.getUnreadCount.mockReset();
    socket.onMessage = null;
  });

  it('keeps the backend count when a socket notification was already included', async () => {
    api.getUnreadCount.mockResolvedValueOnce(1);
    api.getUnreadCount.mockResolvedValueOnce(1);
    renderInbox();

    expect(await screen.findByText('count:1')).toBeInTheDocument();

    act(() => {
      socket.onMessage?.(incoming);
    });

    await waitFor(() => expect(api.getUnreadCount).toHaveBeenCalledTimes(2));
    expect(screen.getByText('count:1')).toBeInTheDocument();
    expect(screen.queryByText('count:2')).not.toBeInTheDocument();
    expect(screen.getByText('latest:Ana')).toBeInTheDocument();
  });

  it('adopts the backend count when a socket notification is genuinely new', async () => {
    api.getUnreadCount.mockResolvedValueOnce(1);
    api.getUnreadCount.mockResolvedValueOnce(2);
    renderInbox();

    expect(await screen.findByText('count:1')).toBeInTheDocument();

    act(() => {
      socket.onMessage?.(incoming);
    });

    expect(await screen.findByText('count:2')).toBeInTheDocument();
    expect(screen.getByText('deliveries:1')).toBeInTheDocument();
  });

  it('ignores a duplicate socket id without another count refresh', async () => {
    api.getUnreadCount.mockResolvedValue(1);
    renderInbox();

    expect(await screen.findByText('count:1')).toBeInTheDocument();

    act(() => {
      socket.onMessage?.(incoming);
    });
    await waitFor(() => expect(api.getUnreadCount).toHaveBeenCalledTimes(2));
    expect(screen.getByText('deliveries:1')).toBeInTheDocument();

    act(() => {
      socket.onMessage?.(incoming);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(api.getUnreadCount).toHaveBeenCalledTimes(2);
    expect(screen.getByText('deliveries:1')).toBeInTheDocument();
    expect(screen.getByText('count:1')).toBeInTheDocument();
  });

  it('does not refresh the count for an id that was already loaded', async () => {
    const user = userEvent.setup();
    api.getUnreadCount.mockResolvedValue(1);
    renderInbox();

    expect(await screen.findByText('count:1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recordar' }));

    act(() => {
      socket.onMessage?.({ ...incoming, id: 'known' });
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(api.getUnreadCount).toHaveBeenCalledOnce();
    expect(screen.getByText('deliveries:0')).toBeInTheDocument();
    expect(screen.getByText('count:1')).toBeInTheDocument();
  });

  it('keeps the last count and the new notification when the refresh fails', async () => {
    api.getUnreadCount.mockResolvedValueOnce(1);
    api.getUnreadCount.mockRejectedValueOnce(new Error('offline'));
    renderInbox();

    expect(await screen.findByText('count:1')).toBeInTheDocument();

    act(() => {
      socket.onMessage?.(incoming);
    });

    await waitFor(() => expect(api.getUnreadCount).toHaveBeenCalledTimes(2));
    expect(screen.getByText('count:1')).toBeInTheDocument();
    expect(screen.getByText('latest:Ana')).toBeInTheDocument();
    expect(screen.getByText('deliveries:1')).toBeInTheDocument();
  });

  it('replaces the count when mark all clears it', async () => {
    const user = userEvent.setup();
    api.getUnreadCount.mockResolvedValue(4);
    renderInbox();

    expect(await screen.findByText('count:4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByText('count:0')).toBeInTheDocument();
  });
});
