import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { acceptFollowRequest, cancelFollowRequest, listIncomingFollowRequests, listOutgoingFollowRequests, rejectFollowRequest } from './followRequests';

describe('follow requests', () => {
  beforeEach(() => {
    client.post.mockReset();
    client.get.mockReset();
    client.delete.mockReset();
  });

  it('accepts on the canonical path', async () => {
    client.post.mockResolvedValue({ data: { requestId: 'request-1', status: 'ACCEPTED' } });
    await acceptFollowRequest('request-1');
    expect(client.post).toHaveBeenCalledWith('/api/follow-requests/request-1/accept');
  });

  it('propagates a stale rejection', async () => {
    client.post.mockRejectedValue(new AxiosError('conflict'));
    await expect(rejectFollowRequest('request-1')).rejects.toBeInstanceOf(AxiosError);
    expect(client.post).toHaveBeenCalledWith('/api/follow-requests/request-1/reject');
  });

  it('cancels and lists pending requests', async () => {
    client.delete.mockResolvedValue({ data: undefined });
    client.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });
    await cancelFollowRequest('request-1');
    await listIncomingFollowRequests();
    await listOutgoingFollowRequests();
    expect(client.delete).toHaveBeenCalledWith('/api/follow-requests/request-1');
    expect(client.get).toHaveBeenNthCalledWith(1, '/api/follow-requests/incoming');
    expect(client.get).toHaveBeenNthCalledWith(2, '/api/follow-requests/outgoing');
  });
});
