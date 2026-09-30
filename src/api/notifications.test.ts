import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { getNotifications, getUnreadCount, markAllAsRead, markNotificationRead } from './notifications';

const notification = {
  id: 'n1',
  actor: { id: 'actor-1', username: 'facu', displayName: 'Facu', avatarUrl: null },
  type: 'NEW_POST_RESPONSE',
  postId: 'post-1',
  statusId: null,
  followRequestId: null,
  read: true,
  createdAt: '2026-09-30T12:00:00.000Z',
};

describe('notifications api', () => {
  beforeEach(() => {
    client.get.mockReset();
    client.patch.mockReset();
  });

  it('loads a page of notifications', async () => {
    const page = { content: [notification], totalElements: 1, totalPages: 1, number: 0, size: 20, last: true };
    client.get.mockResolvedValue({ data: page });
    await expect(getNotifications(0, 20)).resolves.toEqual(page);
    expect(client.get).toHaveBeenCalledWith('/api/notifications', { params: { page: 0, size: 20 } });
  });

  it('reads the unread count', async () => {
    client.get.mockResolvedValue({ data: { count: 4 } });
    await expect(getUnreadCount()).resolves.toBe(4);
    expect(client.get).toHaveBeenCalledWith('/api/notifications/unread-count');
  });

  it('marks one notification as read without a body', async () => {
    client.patch.mockResolvedValue({ data: notification });
    await expect(markNotificationRead('n1')).resolves.toEqual(notification);
    expect(client.patch).toHaveBeenCalledWith('/api/notifications/n1/read');
  });

  it('marks every notification as read', async () => {
    client.patch.mockResolvedValue({ data: undefined });
    await markAllAsRead();
    expect(client.patch).toHaveBeenCalledWith('/api/notifications/read-all');
  });

  it('propagates a missing notification', async () => {
    const error = new AxiosError('missing');
    error.response = { status: 404, data: {}, statusText: 'Not Found', headers: {}, config: {} as never };
    client.patch.mockRejectedValue(error);
    await expect(markNotificationRead('missing')).rejects.toBeInstanceOf(AxiosError);
  });
});
