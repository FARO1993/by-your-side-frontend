import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { acceptFollowRequest, rejectFollowRequest } from './followRequests';

describe('follow requests', () => {
  beforeEach(() => {
    client.post.mockReset();
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
});
