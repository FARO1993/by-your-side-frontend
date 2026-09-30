import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { getUserStatus } from './statuses';

const status = {
  id: 'status-1',
  user: { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null },
  mood: 'WELL',
  createdAt: '2026-09-30T12:00:00.000Z',
  expiresAt: '2026-10-01T12:00:00.000Z',
  reactionCount: 0,
  reactedByCurrentUser: null,
};

describe('user status', () => {
  beforeEach(() => {
    client.get.mockReset();
  });

  it('returns the active status', async () => {
    client.get.mockResolvedValue({ data: status });
    await expect(getUserStatus('user-1')).resolves.toEqual({ kind: 'active', status });
    expect(client.get).toHaveBeenCalledWith('/api/users/user-1/status');
  });

  it('treats an empty 200 body as no active status', async () => {
    client.get.mockResolvedValueOnce({ data: null });
    await expect(getUserStatus('user-1')).resolves.toEqual({ kind: 'none' });

    client.get.mockResolvedValueOnce({ data: '' });
    await expect(getUserStatus('user-1')).resolves.toEqual({ kind: 'none' });
  });

  it('treats 404 as inaccessible', async () => {
    const error = new AxiosError('missing');
    error.response = { status: 404, data: {}, statusText: 'Not Found', headers: {}, config: {} as never };
    client.get.mockRejectedValue(error);
    await expect(getUserStatus('user-1')).resolves.toEqual({ kind: 'hidden' });
  });

  it('propagates other errors', async () => {
    client.get.mockRejectedValue(new AxiosError('offline'));
    await expect(getUserStatus('user-1')).rejects.toBeInstanceOf(AxiosError);
  });
});
