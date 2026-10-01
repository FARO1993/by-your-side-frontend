import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { deletePostResponse, setPostResponse } from './posts';

const summary = {
  postId: 'post-1',
  type: 'WITH_YOU',
  presenceCount: 1,
  listeningCount: 0,
};

describe('post responses', () => {
  beforeEach(() => {
    client.put.mockReset();
    client.delete.mockReset();
    client.put.mockResolvedValue({ data: summary });
    client.delete.mockResolvedValue({ data: { ...summary, type: null, presenceCount: 0 } });
  });

  it('puts WITH_YOU on the response path', async () => {
    await expect(setPostResponse('post-1', 'WITH_YOU')).resolves.toEqual(summary);
    expect(client.put).toHaveBeenCalledWith('/api/posts/post-1/response', { type: 'WITH_YOU' });
  });

  it('puts LISTENING on the response path', async () => {
    client.put.mockResolvedValue({ data: { ...summary, type: 'LISTENING', presenceCount: 0, listeningCount: 1 } });
    await setPostResponse('post-1', 'LISTENING');
    expect(client.put).toHaveBeenCalledWith('/api/posts/post-1/response', { type: 'LISTENING' });
  });

  it('deletes the response', async () => {
    await deletePostResponse('post-1');
    expect(client.delete).toHaveBeenCalledWith('/api/posts/post-1/response');
  });

  it('propagates a failed request', async () => {
    client.put.mockRejectedValue(new AxiosError('no'));
    await expect(setPostResponse('post-1', 'HUG')).rejects.toBeInstanceOf(AxiosError);
  });
});
