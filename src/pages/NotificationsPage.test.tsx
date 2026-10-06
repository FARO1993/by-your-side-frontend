import { AxiosError } from 'axios';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Notification } from '../api/types';

const api = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAllAsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  acceptFollowRequest: vi.fn(),
  rejectFollowRequest: vi.fn(),
}));

const inbox = vi.hoisted(() => ({
  notificationUnread: 0,
  setNotificationUnread: vi.fn(),
  subscribe: vi.fn<(listener: (notification: Notification) => void) => () => void>(() => () => {}),
  remember: vi.fn(),
}));

vi.mock('../api/notifications', () => ({
  getNotifications: api.getNotifications,
  getUnreadCount: api.getUnreadCount,
  markAllAsRead: api.markAllAsRead,
  markNotificationRead: api.markNotificationRead,
}));

vi.mock('../api/followRequests', () => ({
  acceptFollowRequest: api.acceptFollowRequest,
  rejectFollowRequest: api.rejectFollowRequest,
}));

vi.mock('../context/notificationUnreadContext', () => ({
  useNotificationUnread: () => inbox,
}));

import NotificationsPage from './NotificationsPage';

function note(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    actor: { id: 'actor-1', username: 'facu', displayName: 'Facu Test', avatarId: null },
    type: 'NEW_FOLLOWER',
    postId: null,
    statusId: null,
    followRequestId: null,
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function page(content: Notification[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: 20, last: true };
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function ProfileProbe() {
  const { userId } = useParams();
  return <p>Perfil {userId}</p>;
}

function PostProbe() {
  const { postId } = useParams();
  return <p>Post {postId}</p>;
}

function FeedProbe() {
  return <p>Inicio</p>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/notifications']}>
      <Routes>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile/:userId" element={<ProfileProbe />} />
        <Route path="/posts/:postId" element={<PostProbe />} />
        <Route path="/feed" element={<FeedProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    api.getNotifications.mockReset();
    api.getUnreadCount.mockReset();
    api.markAllAsRead.mockReset();
    inbox.notificationUnread = 0;
    inbox.setNotificationUnread.mockReset();
    inbox.subscribe.mockReset();
    inbox.subscribe.mockImplementation(() => () => {});
    inbox.remember.mockReset();
    api.getNotifications.mockResolvedValue(page([]));
    api.getUnreadCount.mockResolvedValue(0);
    api.markAllAsRead.mockResolvedValue(undefined);
    api.markNotificationRead.mockReset();
    api.markNotificationRead.mockResolvedValue(note({ read: true }));
    api.acceptFollowRequest.mockReset();
    api.rejectFollowRequest.mockReset();
  });

  it('renders the list with the real action copy and a vertical header', async () => {
    api.getNotifications.mockResolvedValue(page([note()]));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Novedades' })).toBeInTheDocument();
    expect(screen.getByText('Lo que fue apareciendo mientras no estabas.')).toBeInTheDocument();
    const header = screen.getByRole('heading', { name: 'Novedades' }).closest('header');
    expect(header?.className).toContain('flex-col');
    expect(screen.getByText('Facu Test')).toBeInTheDocument();
    expect(screen.getByText(/empezó a acompañarte/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Facu Test empezó a acompañarte/ });
    const time = link.querySelector('time');
    expect(time).not.toBeNull();
    expect(within(link).getByText('Facu Test').compareDocumentPosition(time as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(link.className).toContain('bg-presence-soft/40');
    expect(link.querySelector('.rounded-full.bg-presence')).not.toBeNull();
  });

  it('styles a read notification without the unread dot', async () => {
    api.getNotifications.mockResolvedValue(page([note({ read: true })]));
    renderPage();

    const link = await screen.findByRole('link', { name: /Leída/ });
    expect(link.className).toContain('bg-card');
    expect(link.className).not.toContain('bg-presence-soft/40');
    expect(link.querySelector('.rounded-full.bg-presence')).toBeNull();
    expect(screen.getByRole('button', { name: 'Marcar todo como leído' })).toBeDisabled();
  });

  it('marks every visible notification as read and refreshes the unread count', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockResolvedValue(page([note()]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Marcar todo como leído' }));

    await waitFor(() => expect(api.markAllAsRead).toHaveBeenCalledOnce());
    await waitFor(() => expect(inbox.setNotificationUnread).toHaveBeenCalledWith(0));
    expect(screen.getByRole('link', { name: /Facu Test empezó a acompañarte\. Leída/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Sin leer/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar todo como leído' })).toBeDisabled();
  });

  it('keeps unread notifications when mark all fails', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockResolvedValue(page([note()]));
    api.markAllAsRead.mockRejectedValue(new Error('offline'));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Marcar todo como leído' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos marcar las novedades como leídas.');
    expect(screen.getByRole('link', { name: /Sin leer/ })).toBeInTheDocument();
    expect(inbox.setNotificationUnread).not.toHaveBeenCalled();
  });

  it('opens the real destination for each notification type', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockResolvedValue(
      page([
        note(),
        note({
          id: 'comment',
          type: 'NEW_COMMENT',
          postId: 'post-9',
          actor: { id: 'luz', username: 'luz', displayName: 'Luz', avatarId: null },
        }),
        note({
          id: 'status',
          type: 'NEW_STATUS_REACTION',
          actor: { id: 'sol', username: 'sol', displayName: 'Sol', avatarId: null },
        }),
        note({
          id: 'request',
          type: 'FOLLOW_REQUEST_RECEIVED',
          actor: { id: 'rio', username: 'rio', displayName: 'Río', avatarId: null },
        }),
        note({
          id: 'accepted',
          type: 'FOLLOW_REQUEST_ACCEPTED',
          actor: { id: 'mar', username: 'mar', displayName: 'Mar', avatarId: null },
        }),
      ]),
    );
    renderPage();

    expect(await screen.findByText(/quiere acompañarte/)).toBeInTheDocument();
    expect(screen.getByText(/aceptó tu solicitud/)).toBeInTheDocument();
    expect(screen.getByText(/reaccionó a tu estado/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Luz respondió tu publicación/ }));
    expect(await screen.findByText('Post post-9')).toBeInTheDocument();
  });

  it('opens a follower on their profile', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockResolvedValue(page([note()]));
    renderPage();

    await user.click(await screen.findByRole('link', { name: /Facu Test/ }));
    expect(await screen.findByText('Perfil actor-1')).toBeInTheDocument();
  });

  it('groups notifications by calendar day', async () => {
    api.getNotifications.mockResolvedValue(
      page([
        note({ id: 'today', createdAt: daysAgo(0) }),
        note({ id: 'yesterday', createdAt: daysAgo(1), actor: { id: 'a2', username: 'ana', displayName: 'Ana', avatarId: null } }),
        note({ id: 'older', createdAt: daysAgo(4), actor: { id: 'a3', username: 'leo', displayName: 'Leo', avatarId: null } }),
      ]),
    );
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Hoy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ayer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Anteriores' })).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Todavía no hay novedades' })).toBeInTheDocument();
    expect(screen.getByText('Cuando alguien interactúe con vos o te acompañe, va a aparecer acá.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar todo como leído' })).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading and not a full-page spinner', async () => {
    let resolvePage: (value: ReturnType<typeof page>) => void = () => {};
    api.getNotifications.mockReturnValue(new Promise((resolve) => {
      resolvePage = resolve;
    }));
    renderPage();

    expect(await screen.findByRole('status', { name: 'Cargando novedades' })).toBeInTheDocument();
    expect(screen.queryByText('Cargando')).not.toBeInTheDocument();

    resolvePage(page([note()]));
    expect(await screen.findByText('Facu Test')).toBeInTheDocument();
  });

  it('shows a load error and retries', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockRejectedValueOnce(new Error('offline'));
    api.getNotifications.mockResolvedValueOnce(page([note()]));
    renderPage();

    expect(await screen.findByText('No pudimos cargar tus novedades.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Facu Test')).toBeInTheDocument();
  });

  it('prepends a realtime notification without requesting the list again', async () => {
    let push: (notification: Notification) => void = () => {};
    inbox.subscribe.mockImplementation((listener: (notification: Notification) => void) => {
      push = listener;
      return () => {};
    });
    api.getNotifications.mockResolvedValue(page([note({ read: true })]));
    renderPage();

    expect(await screen.findByText('Facu Test')).toBeInTheDocument();
    expect(api.getNotifications).toHaveBeenCalledOnce();

    act(() => {
      push(
        note({
          id: 'live',
          type: 'NEW_POST_RESPONSE',
          postId: 'post-3',
          actor: { id: 'ana', username: 'ana', displayName: 'Ana', avatarId: null },
        }),
      );
    });

    expect(await screen.findByText(/respondió a tu publicación/)).toBeInTheDocument();
    expect(api.getNotifications).toHaveBeenCalledOnce();

    act(() => {
      push(note({ id: 'n1', read: true }));
    });
    expect(screen.getAllByRole('link', { name: /Facu Test/ })).toHaveLength(1);
  });

  it('marks one notification as read and opens the post', async () => {
    const user = userEvent.setup();
    inbox.notificationUnread = 5;
    api.getNotifications.mockResolvedValue(
      page([note({ type: 'NEW_POST_RESPONSE', postId: 'post-9', read: false })]),
    );
    renderPage();

    await user.click(await screen.findByRole('link', { name: /respondió a tu publicación/ }));

    expect(api.markNotificationRead).toHaveBeenCalledWith('n1');
    expect(inbox.setNotificationUnread).toHaveBeenCalledWith(4);
    expect(await screen.findByText('Post post-9')).toBeInTheDocument();
  });

  it('does not decrement the unread count when the notification is already read', async () => {
    const user = userEvent.setup();
    inbox.notificationUnread = 5;
    api.getNotifications.mockResolvedValue(page([note({ read: true })]));
    renderPage();

    await user.click(await screen.findByRole('link', { name: /Leída/ }));

    expect(api.markNotificationRead).not.toHaveBeenCalled();
    expect(inbox.setNotificationUnread).not.toHaveBeenCalled();
  });

  it('restores the unread notification when mark-one fails', async () => {
    const user = userEvent.setup();
    inbox.notificationUnread = 5;
    api.markNotificationRead.mockRejectedValue(new Error('offline'));
    api.getNotifications.mockResolvedValue(page([note({ type: 'NEW_POST_RESPONSE', postId: null })]));
    renderPage();

    await user.click(await screen.findByRole('button', { name: /respondió a tu publicación/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos marcar esa novedad como leída.');
    expect(screen.getByRole('button', { name: /Sin leer/ })).toBeInTheDocument();
    expect(inbox.setNotificationUnread).toHaveBeenLastCalledWith(5);
  });

  it('opens the feed for a status reaction and does not invent a status route', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockResolvedValue(
      page([note({ type: 'NEW_STATUS_REACTION', statusId: 'status-1', read: true })]),
    );
    renderPage();

    const link = await screen.findByRole('link', { name: /reaccionó a tu estado/ });
    expect(link).toHaveAttribute('href', '/feed');
    await user.click(link);
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
  });

  it('opens a follow request profile without accepting it', async () => {
    const user = userEvent.setup();
    api.getNotifications.mockResolvedValue(
      page([
        note({
          type: 'FOLLOW_REQUEST_RECEIVED',
          followRequestId: 'request-1',
          read: true,
        }),
      ]),
    );
    renderPage();

    expect(await screen.findByRole('button', { name: 'Aceptar' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /quiere acompañarte/ }));

    expect(api.acceptFollowRequest).not.toHaveBeenCalled();
    expect(await screen.findByText('Perfil actor-1')).toBeInTheDocument();
  });

  it('retires follow request actions when the request is no longer pending', async () => {
    const user = userEvent.setup();
    const error = new AxiosError('conflict');
    error.response = { status: 409, data: {}, statusText: 'Conflict', headers: {}, config: {} as never };
    api.rejectFollowRequest.mockRejectedValue(error);
    api.getNotifications.mockResolvedValue(
      page([
        note({
          type: 'FOLLOW_REQUEST_RECEIVED',
          followRequestId: 'request-1',
          read: true,
        }),
      ]),
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Rechazar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Esa solicitud ya no está pendiente.');
    expect(screen.getByRole('link', { name: /quiere acompañarte/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
  });
});
